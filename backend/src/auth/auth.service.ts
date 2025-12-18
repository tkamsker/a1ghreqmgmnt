import { randomBytes } from 'crypto';

import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: AppConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.jwtSecret,
      expiresIn: this.configService.jwtExpiresIn,
    });

    // Generate refresh token
    const refreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Generate new tokens
    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
