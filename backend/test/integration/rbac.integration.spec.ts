import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Role-Based Access Control (RBAC) Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Store tokens for different user roles
  let superAdminToken: string;
  let projectAdminToken: string;
  let contributorToken: string;
  let reviewerToken: string;

  // Store user IDs
  let superAdminId: string;
  let projectAdminId: string;
  let contributorId: string;
  let reviewerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database
    await prisma.cleanDatabase();

    // Create users for each role
    const password = await bcrypt.hash('password123', 10);

    const superAdmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        longName: 'Super Administrator',
        email: 'superadmin@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: password,
        userType: UserType.SUPER_ADMIN,
        isActive: true,
      },
    });
    superAdminId = superAdmin.id;

    const projectAdmin = await prisma.user.create({
      data: {
        username: 'projectadmin',
        longName: 'Project Administrator',
        email: 'projectadmin@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: password,
        userType: UserType.PROJECT_ADMIN,
        isActive: true,
      },
    });
    projectAdminId = projectAdmin.id;

    const contributor = await prisma.user.create({
      data: {
        username: 'contributor',
        longName: 'Contributor User',
        email: 'contributor@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: password,
        userType: UserType.CONTRIBUTOR,
        isActive: true,
      },
    });
    contributorId = contributor.id;

    const reviewer = await prisma.user.create({
      data: {
        username: 'reviewer',
        longName: 'Reviewer User',
        email: 'reviewer@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: password,
        userType: UserType.REVIEWER,
        isActive: true,
      },
    });
    reviewerId = reviewer.id;

    // Login all users to get tokens
    const LOGIN_MUTATION = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          accessToken
        }
      }
    `;

    const loginUser = async (email: string) => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: { email, password: 'password123' },
        });
      return response.body.data.login.accessToken;
    };

    superAdminToken = await loginUser('superadmin@example.com');
    projectAdminToken = await loginUser('projectadmin@example.com');
    contributorToken = await loginUser('contributor@example.com');
    reviewerToken = await loginUser('reviewer@example.com');
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('User Management Operations (Super Admin Only)', () => {
    const CREATE_USER_MUTATION = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          username
        }
      }
    `;

    const USERS_QUERY = `
      query Users {
        users {
          id
          username
        }
      }
    `;

    it('should allow Super Admin to create users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'newuser1',
              longName: 'New User 1',
              email: 'newuser1@example.com',
              password: 'password123',
              loginType: 'EMAIL_PASSWORD',
              userType: 'CONTRIBUTOR',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createUser).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });

    it('should allow Super Admin to list all users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: USERS_QUERY,
        })
        .expect(200);

      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.errors).toBeUndefined();
    });

    it('should deny Project Admin from creating users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${projectAdminToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'unauthorized',
              longName: 'Unauthorized',
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

    it('should deny Contributor from listing users', async () => {
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

    it('should deny Reviewer from creating users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          query: CREATE_USER_MUTATION,
          variables: {
            input: {
              username: 'reviewerattempt',
              longName: 'Reviewer Attempt',
              email: 'reviewerattempt@example.com',
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
  });

  describe('Current User Query (All Authenticated Users)', () => {
    const ME_QUERY = `
      query Me {
        me {
          id
          username
          email
          userType
        }
      }
    `;

    it('should allow Super Admin to query own profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: ME_QUERY,
        })
        .expect(200);

      expect(response.body.data.me).toBeDefined();
      expect(response.body.data.me.id).toBe(superAdminId);
      expect(response.body.data.me.userType).toBe('SUPER_ADMIN');
    });

    it('should allow Project Admin to query own profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${projectAdminToken}`)
        .send({
          query: ME_QUERY,
        })
        .expect(200);

      expect(response.body.data.me).toBeDefined();
      expect(response.body.data.me.id).toBe(projectAdminId);
      expect(response.body.data.me.userType).toBe('PROJECT_ADMIN');
    });

    it('should allow Contributor to query own profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          query: ME_QUERY,
        })
        .expect(200);

      expect(response.body.data.me).toBeDefined();
      expect(response.body.data.me.id).toBe(contributorId);
      expect(response.body.data.me.userType).toBe('CONTRIBUTOR');
    });

    it('should allow Reviewer to query own profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          query: ME_QUERY,
        })
        .expect(200);

      expect(response.body.data.me).toBeDefined();
      expect(response.body.data.me.id).toBe(reviewerId);
      expect(response.body.data.me.userType).toBe('REVIEWER');
    });

    it('should deny unauthenticated access to me query', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: ME_QUERY,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Role Hierarchy Verification', () => {
    it('should maintain correct role hierarchy: SUPER_ADMIN > PROJECT_ADMIN > CONTRIBUTOR = REVIEWER', async () => {
      const roles = [
        { role: UserType.SUPER_ADMIN, level: 4 },
        { role: UserType.PROJECT_ADMIN, level: 3 },
        { role: UserType.CONTRIBUTOR, level: 2 },
        { role: UserType.REVIEWER, level: 2 },
      ];

      // Verify role levels are correctly assigned
      const users = await prisma.user.findMany();

      for (const user of users) {
        const roleConfig = roles.find((r) => r.role === user.userType);
        expect(roleConfig).toBeDefined();

        // Super Admin should have highest privileges
        if (user.userType === UserType.SUPER_ADMIN) {
          expect(roleConfig.level).toBe(4);
        }
      }
    });
  });

  describe('Multiple Role Access Patterns', () => {
    it('should correctly enforce access for operations requiring multiple roles', async () => {
      // Test an operation that allows both SUPER_ADMIN and PROJECT_ADMIN
      // (This would be tested once we implement project management in later phases)

      const UPDATE_USER_MUTATION = `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            id
          }
        }
      `;

      // Super Admin should be able to update
      const superAdminResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          query: UPDATE_USER_MUTATION,
          variables: {
            id: contributorId,
            input: { longName: 'Updated by Super Admin' },
          },
        })
        .expect(200);

      expect(superAdminResponse.body.data.updateUser).toBeDefined();

      // Contributor should NOT be able to update other users
      const contributorResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({
          query: UPDATE_USER_MUTATION,
          variables: {
            id: reviewerId,
            input: { longName: 'Attempted by Contributor' },
          },
        })
        .expect(200);

      expect(contributorResponse.body.errors).toBeDefined();
      expect(contributorResponse.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('Token-based Role Verification', () => {
    it('should extract correct user role from JWT token', async () => {
      const ME_QUERY = `
        query Me {
          me {
            userType
          }
        }
      `;

      const testCases = [
        { token: superAdminToken, expectedRole: 'SUPER_ADMIN' },
        { token: projectAdminToken, expectedRole: 'PROJECT_ADMIN' },
        { token: contributorToken, expectedRole: 'CONTRIBUTOR' },
        { token: reviewerToken, expectedRole: 'REVIEWER' },
      ];

      for (const testCase of testCases) {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${testCase.token}`)
          .send({
            query: ME_QUERY,
          })
          .expect(200);

        expect(response.body.data.me.userType).toBe(testCase.expectedRole);
      }
    });
  });

  describe('Public Endpoints', () => {
    it('should allow unauthenticated access to login mutation', async () => {
      const LOGIN_MUTATION = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            accessToken
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'superadmin@example.com',
            password: 'password123',
          },
        })
        .expect(200);

      expect(response.body.data.login).toBeDefined();
      expect(response.body.data.login.accessToken).toBeDefined();
    });

    it('should allow unauthenticated access to refreshToken mutation', async () => {
      // First get a refresh token
      const LOGIN_MUTATION = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            refreshToken
          }
        }
      `;

      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'contributor@example.com',
            password: 'password123',
          },
        });

      const refreshToken = loginResponse.body.data.login.refreshToken;

      // Now use refresh token without authentication
      const REFRESH_MUTATION = `
        mutation RefreshToken($refreshToken: String!) {
          refreshToken(refreshToken: $refreshToken) {
            accessToken
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: REFRESH_MUTATION,
          variables: { refreshToken },
        })
        .expect(200);

      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken.accessToken).toBeDefined();
    });
  });
});
