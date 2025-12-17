import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 4000);
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  get databaseUrl(): string {
    return this.configService.get<string>(
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5432/reqmgmt',
    );
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  get awsRegion(): string {
    return this.configService.get<string>('AWS_REGION', 'us-east-1');
  }

  get awsAccessKeyId(): string {
    return this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
  }

  get awsSecretAccessKey(): string {
    return this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY');
  }

  get awsS3Bucket(): string {
    return this.configService.get<string>('AWS_S3_BUCKET', 'reqmgmt-attachments');
  }

  get awsS3Endpoint(): string | undefined {
    return this.configService.get<string>('AWS_S3_ENDPOINT');
  }

  get awsS3ForcePathStyle(): boolean {
    return this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';
  }

  get sentryDsn(): string | undefined {
    return this.configService.get<string>('SENTRY_DSN');
  }

  get sentryEnvironment(): string {
    return this.configService.get<string>('SENTRY_ENVIRONMENT', this.nodeEnv);
  }

  get throttleTtl(): number {
    return this.configService.get<number>('THROTTLE_TTL', 60);
  }

  get throttleLimit(): number {
    return this.configService.get<number>('THROTTLE_LIMIT', 100);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
