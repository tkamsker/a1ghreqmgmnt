import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();

    const now = Date.now();
    const operationType = info?.operation?.operation || 'unknown';
    const fieldName = info?.fieldName || 'unknown';

    this.logger.log(`→ ${operationType.toUpperCase()} ${fieldName}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(`← ${operationType.toUpperCase()} ${fieldName} +${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `✗ ${operationType.toUpperCase()} ${fieldName} +${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
