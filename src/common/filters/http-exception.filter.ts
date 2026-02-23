import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  APIError,
  APIConnectionError,
  RateLimitError,
  AuthenticationError,
} from 'openai';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolveException(exception);

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string;
    error: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const extracted =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ??
            exception.message);

      return {
        status: exception.getStatus(),
        message: Array.isArray(extracted) ? extracted.join('; ') : extracted,
        error: HttpStatus[exception.getStatus()] ?? 'Error',
      };
    }

    if (exception instanceof RateLimitError) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'AI provider rate limit exceeded. Please retry later.',
        error: 'Too Many Requests',
      };
    }

    if (exception instanceof AuthenticationError) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        message:
          'AI provider authentication failed. Check server configuration.',
        error: 'Bad Gateway',
      };
    }

    if (exception instanceof APIConnectionError) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        message: 'Unable to reach AI provider. Please retry later.',
        error: 'Bad Gateway',
      };
    }

    if (exception instanceof APIError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const upstreamStatus: number | undefined = exception.status;
      const mapped =
        upstreamStatus != null && upstreamStatus >= 500
          ? HttpStatus.BAD_GATEWAY
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return {
        status: mapped,
        message: `AI provider error: ${exception.message}`,
        error:
          mapped === HttpStatus.BAD_GATEWAY
            ? 'Bad Gateway'
            : 'Internal Server Error',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
