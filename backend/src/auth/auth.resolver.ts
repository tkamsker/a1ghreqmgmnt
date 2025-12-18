import { UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args } from '@nestjs/graphql';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload';
import { GqlAuthGuard } from './guards/gql-auth.guard';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  userType: string;
}

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @Public()
  async login(@Args('email') email: string, @Args('password') password: string) {
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthPayload)
  @Public()
  async refreshToken(@Args('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshToken(refreshToken);

    // Need to get user for response
    const payload = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    return payload;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.sub);
    return true;
  }
}
