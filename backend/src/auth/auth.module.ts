import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { UsersModule } from '../users/users.module';

import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
