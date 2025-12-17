import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserType } from '@prisma/client';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  userType: string;
}

@Resolver(() => User)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  @Roles(UserType.SUPER_ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @Roles(UserType.SUPER_ADMIN)
  async findOne(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => User, { name: 'me' })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Mutation(() => User)
  @Roles(UserType.SUPER_ADMIN)
  async createUser(@Args('input') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => User)
  @Roles(UserType.SUPER_ADMIN)
  async updateUser(@Args('id') id: string, @Args('input') updateUserInput: UpdateUserInput) {
    return this.usersService.update(id, updateUserInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserType.SUPER_ADMIN)
  async deleteUser(@Args('id') id: string) {
    await this.usersService.remove(id);
    return true;
  }
}
