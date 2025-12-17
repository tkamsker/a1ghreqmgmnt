import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Users Contract Tests (GraphQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let superAdminToken: string;
  let contributorToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database before tests
    await prisma.cleanDatabase();

    // Create Super Admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        longName: 'Super Admin',
        email: 'admin@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: adminPassword,
        userType: UserType.SUPER_ADMIN,
        isActive: true,
      },
    });

    // Create Contributor user
    const contributorPassword = await bcrypt.hash('contributor123', 10);
    await prisma.user.create({
      data: {
        username: 'contributor',
        longName: 'Test Contributor',
        email: 'contributor@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: contributorPassword,
        userType: UserType.CONTRIBUTOR,
        isActive: true,
      },
    });

    // Login as Super Admin
    const LOGIN_MUTATION = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          accessToken
        }
      }
    `;

    const adminResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: LOGIN_MUTATION,
        variables: { email: 'admin@example.com', password: 'admin123' },
      });
    superAdminToken = adminResponse.body.data.login.accessToken;

    const contributorResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: LOGIN_MUTATION,
        variables: { email: 'contributor@example.com', password: 'contributor123' },
      });
    contributorToken = contributorResponse.body.data.login.accessToken;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('createUser mutation', () => {
    const CREATE_USER_MUTATION = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          username
          longName
          email
          loginType
          userType
          isActive
        }
      }
    `;

    it('should create a new user when authenticated as Super Admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'newuser',
              longName: 'New User',
              email: 'newuser@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createUser).toBeDefined();
      expect(response.body.data.createUser).toMatchObject({
        username: 'newuser',
        longName: 'New User',
        email: 'newuser@example.com',
        loginType: 'EMAIL_PASSWORD',
        userType: 'CONTRIBUTOR',
        isActive: true,
      });
      expect(response.body.data.createUser.id).toBeDefined();
    });

    it('should return error when creating user with duplicate username', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'admin', // Already exists
              longName: 'Duplicate Admin',
              email: 'duplicate@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('username already exists');
    });

    it('should return error when creating user with duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'uniqueuser',
              longName: 'Unique User',
              email: 'admin@example.com', // Already exists
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('email already exists');
    });

    it('should return error when non-Super Admin tries to create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'unauthorizeduser',
              longName: 'Unauthorized User',
              email: 'unauthorized@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });

    it('should return error when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'unauthuser',
              longName: 'Unauth User',
              email: 'unauth@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: '', // Invalid - empty
              longName: 'Test',
              email: 'invalid@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('updateUser mutation', () => {
    const UPDATE_USER_MUTATION = `
      mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
        updateUser(id: $id, input: $input) {
          id
          username
          longName
          email
          isActive
        }
      }
    `;

    let testUserId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          username: 'updatetest',
          longName: 'Update Test User',
          email: 'updatetest@example.com',
          loginType: LoginType.EMAIL_PASSWORD,
          passwordHash: await bcrypt.hash('password123', 10),
          userType: UserType.CONTRIBUTOR,
          isActive: true,
        },
      });
      testUserId = user.id;
    });

    it('should update user when authenticated as Super Admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: UPDATE_USER_MUTATION,
          variables: {
            id: testUserId,
            input: {
              longName: 'Updated Name',
              isActive: false,
            },
          },
        })
        .expect(200);

      expect(response.body.data.updateUser).toBeDefined();
      expect(response.body.data.updateUser).toMatchObject({
        id: testUserId,
        longName: 'Updated Name',
        isActive: false,
      });
    });

    it('should return error when non-Super Admin tries to update user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          query: UPDATE_USER_MUTATION,
          variables: {
            id: testUserId,
            input: {
              longName: 'Unauthorized Update',
            },
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('users query', () => {
    const USERS_QUERY = `
      query Users {
        users {
          id
          username
          email
          userType
          isActive
        }
      }
    `;

    it('should return all users when authenticated as Super Admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: USERS_QUERY,
        })
        .expect(200);

      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should return error when non-Super Admin tries to list users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          query: USERS_QUERY,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('user query', () => {
    const USER_QUERY = `
      query User($id: ID!) {
        user(id: $id) {
          id
          username
          email
          longName
          userType
          isActive
        }
      }
    `;

    it('should return specific user when authenticated as Super Admin', async () => {
      const users = await prisma.user.findMany({ take: 1 });
      const userId = users[0].id;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: USER_QUERY,
          variables: { id: userId },
        })
        .expect(200);

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(userId);
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: USER_QUERY,
          variables: { id: 'non-existent-id' },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not found');
    });
  });
});
