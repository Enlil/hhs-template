import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

// Normalizes both HttpExceptions (e.g. ValidationPipe failures) and
// unexpected errors into one JSON shape, matching ErrorResponse in
// shared/contracts/openapi.yaml. @Catch() with no argument replaces Nest's
// default handling entirely, so unexpected (non-HttpException) errors are
// logged here — otherwise they'd disappear with no server-side trace.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };

    if (!(exception instanceof HttpException)) {
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, (exception as Error)?.stack ?? exception);
    }

    const normalized =
      typeof body === 'string' ? { statusCode: status, message: body } : { statusCode: status, ...(body as Record<string, unknown>) };

    response.status(status).json(normalized);
  }
}
