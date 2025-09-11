import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let errors = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const ex = exception.getResponse();
      if (typeof ex === 'string') message = ex;
      else if (typeof ex === 'object' && (ex as any).message) {
        message = (ex as any).message;
        errors = (ex as any).errors || null;
      }
    }

    this.logger.error(
      `${req.method} ${req.url} ${status} - ${message}`,
      (exception as any).stack,
    );

    res.status(status).json({
      status,
      success: status >= 200 && status < 300,
      message,
      errors,
    });
  }
}
