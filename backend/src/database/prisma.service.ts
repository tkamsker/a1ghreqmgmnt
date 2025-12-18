import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Prisma event types
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Clean all database tables (for testing purposes only)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      const keyStr = String(key);
      return keyStr[0] !== '_' && keyStr[0] !== '$';
    });

    return Promise.all(
      models.map((modelKey) => {
        // @ts-expect-error - Dynamic model access
        return this[modelKey].deleteMany();
      }),
    );
  }
}
