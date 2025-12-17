import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { where?: Prisma.UserWhereInput }): Promise<User[]> {
    return this.prisma.user.findMany(params);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    // Check for duplicate username
    const existingUsername = await this.prisma.user.findFirst({
      where: { username: createUserInput.username },
    });

    if (existingUsername) {
      throw new ConflictException('username already exists');
    }

    // Check for duplicate email
    if (createUserInput.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: createUserInput.email },
      });

      if (existingEmail) {
        throw new ConflictException('email already exists');
      }
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (createUserInput.password) {
      passwordHash = await bcrypt.hash(createUserInput.password, 10);
    }

    // Create user
    return this.prisma.user.create({
      data: {
        username: createUserInput.username,
        longName: createUserInput.longName,
        email: createUserInput.email,
        passwordHash,
        loginType: createUserInput.loginType,
        userType: createUserInput.userType,
        isActive: true,
      },
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    // Check if user exists
    await this.findOne(id);

    // Check for duplicate username if updating
    if (updateUserInput.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: updateUserInput.username,
          id: { not: id },
        },
      });

      if (existingUsername) {
        throw new ConflictException('username already exists');
      }
    }

    // Check for duplicate email if updating
    if (updateUserInput.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: updateUserInput.email,
          id: { not: id },
        },
      });

      if (existingEmail) {
        throw new ConflictException('email already exists');
      }
    }

    // Hash password if provided
    const updateData: Prisma.UserUpdateInput = {
      ...updateUserInput,
    };

    if (updateUserInput.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserInput.password, 10);
      delete updateData.password;
    }

    // Update user
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
