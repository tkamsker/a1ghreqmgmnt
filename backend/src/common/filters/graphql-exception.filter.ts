import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();

    this.logger.error(
      `GraphQL Error in ${info.fieldName}`,
      exception instanceof Error ? exception.stack : exception,
    );

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return new GraphQLError(
        typeof response === 'string' ? response : (response as { message: string }).message,
        {
          extensions: {
            code: this.getErrorCode(status),
            statusCode: status,
          },
        },
      );
    }

    if (exception instanceof GraphQLError) {
      return exception;
    }

    // Unknown error
    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }

  private getErrorCode(statusCode: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return codeMap[statusCode] || 'UNKNOWN_ERROR';
  }
}
