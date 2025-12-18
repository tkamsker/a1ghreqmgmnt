import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/database/prisma.service';

describe('JWT Authentication Flow Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let jwtService: JwtService;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authService = app.get<AuthService>(AuthService);
    jwtService = app.get<JwtService>(JwtService);

    // Clean database
    await prisma.cleanDatabase();

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
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

  describe('Complete Authentication Flow', () => {
    it('should complete full authentication cycle: login -> verify token -> refresh -> logout', async () => {
      // Step 1: Login
      const loginResult = await authService.login('test@example.com', 'testpass123');

      expect(loginResult).toBeDefined();
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.user.id).toBe(testUserId);

      const { accessToken, refreshToken } = loginResult;

      // Step 2: Verify access token is valid
      const accessPayload = jwtService.verify(accessToken);
      expect(accessPayload.sub).toBe(testUserId);
      expect(accessPayload.email).toBe('test@example.com');
      expect(accessPayload.userType).toBe('CONTRIBUTOR');

      // Step 3: Verify refresh token is stored in database
      const storedRefreshToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(storedRefreshToken).toBeDefined();
      expect(storedRefreshToken.userId).toBe(testUserId);
      expect(storedRefreshToken.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Step 4: Use refresh token to get new tokens
      const refreshResult = await authService.refreshToken(refreshToken);
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(accessToken); // Should be new token
      expect(refreshResult.refreshToken).not.toBe(refreshToken); // Should be new token

      // Step 5: Verify old refresh token is revoked
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(oldToken).toBeNull(); // Should be deleted

      // Step 6: Verify new refresh token is stored
      const newRefreshToken = await prisma.refreshToken.findUnique({
        where: { token: refreshResult.refreshToken },
      });
      expect(newRefreshToken).toBeDefined();
      expect(newRefreshToken.userId).toBe(testUserId);

      // Step 7: Logout (revoke refresh tokens)
      await authService.logout(testUserId);

      // Step 8: Verify all refresh tokens are revoked
      const remainingTokens = await prisma.refreshToken.findMany({
        where: { userId: testUserId },
      });
      expect(remainingTokens).toHaveLength(0);
    });

    it('should handle concurrent refresh token requests correctly', async () => {
      // Login to get initial tokens
      const loginResult = await authService.login('test@example.com', 'testpass123');
      const { refreshToken } = loginResult;

      // Simulate two concurrent refresh requests with the same token
      const [result1, result2] = await Promise.allSettled([
        authService.refreshToken(refreshToken),
        authService.refreshToken(refreshToken),
      ]);

      // Only one should succeed
      const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled');
      const failed = [result1, result2].filter((r) => r.status === 'rejected');

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // The successful request should have new tokens
      if (result1.status === 'fulfilled') {
        expect(result1.value.accessToken).toBeDefined();
        expect(result1.value.refreshToken).toBeDefined();
      }
    });

    it('should reject expired refresh tokens', async () => {
      // Create an expired refresh token
      const expiredToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-token-12345',
          userId: testUserId,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      await expect(authService.refreshToken(expiredToken.token)).rejects.toThrow(
        'Refresh token expired',
      );

      // Verify the expired token is deleted
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: expiredToken.token },
      });
      expect(deletedToken).toBeNull();
    });
  });

  describe('Password Validation', () => {
    it('should correctly validate passwords with bcrypt', async () => {
      const plainPassword = 'mySecurePassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Create user with hashed password
      await prisma.user.create({
        data: {
          username: 'passtest',
          longName: 'Password Test',
          email: 'passtest@example.com',
          loginType: LoginType.EMAIL_PASSWORD,
          passwordHash: hashedPassword,
          userType: UserType.CONTRIBUTOR,
          isActive: true,
        },
      });

      // Should succeed with correct password
      const validResult = await authService.validateUser('passtest@example.com', plainPassword);
      expect(validResult).toBeDefined();
      expect(validResult.email).toBe('passtest@example.com');

      // Should fail with incorrect password
      const invalidResult = await authService.validateUser('passtest@example.com', 'wrongPassword');
      expect(invalidResult).toBeNull();
    });

    it('should handle users without password (federated login)', async () => {
      // Create user with GOOGLE login type (no password)
      await prisma.user.create({
        data: {
          username: 'googleuser',
          longName: 'Google User',
          email: 'google@example.com',
          loginType: LoginType.GOOGLE,
          passwordHash: null, // No password for federated login
          userType: UserType.CONTRIBUTOR,
          isActive: true,
        },
      });

      // Should fail to login with email/password
      await expect(authService.login('google@example.com', 'anypassword')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('Token Generation and Validation', () => {
    it('should generate valid JWT tokens with correct claims', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      const tokens = await authService.generateTokens(user);

      // Verify access token claims
      const accessPayload = jwtService.verify(tokens.accessToken);
      expect(accessPayload.sub).toBe(user.id);
      expect(accessPayload.email).toBe(user.email);
      expect(accessPayload.username).toBe(user.username);
      expect(accessPayload.userType).toBe(user.userType);

      // Verify access token has expiration
      expect(accessPayload.exp).toBeDefined();
      expect(accessPayload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

      // Verify refresh token is stored in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: tokens.refreshToken },
      });
      expect(storedToken).toBeDefined();
      expect(storedToken.userId).toBe(user.id);
    });

    it('should reject tampered tokens', async () => {
      const loginResult = await authService.login('test@example.com', 'testpass123');
      const { accessToken } = loginResult;

      // Tamper with the token
      const tamperedToken = accessToken.slice(0, -5) + 'xxxxx';

      expect(() => jwtService.verify(tamperedToken)).toThrow();
    });
  });

  describe('Account Status Handling', () => {
    it('should reject login for inactive accounts', async () => {
      // Create inactive user
      await prisma.user.create({
        data: {
          username: 'inactive',
          longName: 'Inactive User',
          email: 'inactive@example.com',
          loginType: LoginType.EMAIL_PASSWORD,
          passwordHash: await bcrypt.hash('password123', 10),
          userType: UserType.CONTRIBUTOR,
          isActive: false, // Inactive
        },
      });

      await expect(authService.login('inactive@example.com', 'password123')).rejects.toThrow(
        'Account is inactive',
      );
    });

    it('should allow updating user to inactive and prevent login', async () => {
      // Create active user
      const user = await prisma.user.create({
        data: {
          username: 'todeactivate',
          longName: 'To Deactivate',
          email: 'todeactivate@example.com',
          loginType: LoginType.EMAIL_PASSWORD,
          passwordHash: await bcrypt.hash('password123', 10),
          userType: UserType.CONTRIBUTOR,
          isActive: true,
        },
      });

      // Login should work
      const loginResult1 = await authService.login('todeactivate@example.com', 'password123');
      expect(loginResult1).toBeDefined();

      // Deactivate user
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      // Login should now fail
      await expect(authService.login('todeactivate@example.com', 'password123')).rejects.toThrow(
        'Account is inactive',
      );
    });
  });
});
