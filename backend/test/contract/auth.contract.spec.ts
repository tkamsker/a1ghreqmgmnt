import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Auth Contract Tests (GraphQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

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

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        longName: 'Test User',
        email: 'test@example.com',
        loginType: LoginType.EMAIL_PASSWORD,
        passwordHash: hashedPassword,
        userType: UserType.CONTRIBUTOR,
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('login mutation', () => {
    const LOGIN_MUTATION = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          accessToken
          refreshToken
          user {
            id
            username
            email
            userType
            isActive
          }
        }
      }
    `;

    it('should return access token, refresh token, and user data on successful login', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'password123',
          },
        })
        .expect(200);

      expect(response.body.data.login).toBeDefined();
      expect(response.body.data.login.accessToken).toBeDefined();
      expect(response.body.data.login.refreshToken).toBeDefined();
      expect(response.body.data.login.user).toMatchObject({
        id: testUserId,
        username: 'testuser',
        email: 'test@example.com',
        userType: 'CONTRIBUTOR',
        isActive: true,
      });
      expect(typeof response.body.data.login.accessToken).toBe('string');
      expect(typeof response.body.data.login.refreshToken).toBe('string');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid credentials');
    });

    it('should return error for inactive user', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          username: 'inactiveuser',
          longName: 'Inactive User',
          email: 'inactive@example.com',
          loginType: LoginType.EMAIL_PASSWORD,
          passwordHash: hashedPassword,
          userType: UserType.CONTRIBUTOR,
          isActive: false,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'inactive@example.com',
            password: 'password123',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Account is inactive');
    });
  });

  describe('refreshToken mutation', () => {
    const REFRESH_TOKEN_MUTATION = `
      mutation RefreshToken($refreshToken: String!) {
        refreshToken(refreshToken: $refreshToken) {
          accessToken
          refreshToken
        }
      }
    `;

    let validRefreshToken: string;

    beforeAll(async () => {
      // Get a valid refresh token by logging in
      const LOGIN_MUTATION = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            refreshToken
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'password123',
          },
        });

      validRefreshToken = response.body.data.login.refreshToken;
    });

    it('should return new access and refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: REFRESH_TOKEN_MUTATION,
          variables: {
            refreshToken: validRefreshToken,
          },
        })
        .expect(200);

      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken.accessToken).toBeDefined();
      expect(response.body.data.refreshToken.refreshToken).toBeDefined();
      expect(typeof response.body.data.refreshToken.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken.refreshToken).toBe('string');
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: REFRESH_TOKEN_MUTATION,
          variables: {
            refreshToken: 'invalid-token',
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid refresh token');
    });

    it('should return error for expired refresh token', async () => {
      // Create expired refresh token
      const expiredToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-token-12345',
          userId: testUserId,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: REFRESH_TOKEN_MUTATION,
          variables: {
            refreshToken: expiredToken.token,
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Refresh token expired');
    });
  });

  describe('logout mutation', () => {
    const LOGOUT_MUTATION = `
      mutation Logout {
        logout
      }
    `;

    it('should successfully logout and return true', async () => {
      // First login to get access token
      const LOGIN_MUTATION = `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            accessToken
          }
        }
      `;

      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'password123',
          },
        });

      const accessToken = loginResponse.body.data.login.accessToken;

      // Now logout
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: LOGOUT_MUTATION,
        })
        .expect(200);

      expect(response.body.data.logout).toBe(true);
    });

    it('should return error when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: LOGOUT_MUTATION,
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });
});
