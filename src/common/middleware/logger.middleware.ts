/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = req;
    // Sanitize sensitive fields before logging
    const sensitiveFields = ['password', 'accesstoken'];
    const sanitizedBody = { ...body };
    if (sanitizedBody && typeof sanitizedBody === 'object') {
      for (const field of sensitiveFields) {
        if (field in sanitizedBody) {
          sanitizedBody[field] = '[REDACTED]';
        }
      }
    }
    const now = Date.now();

    // Log request
    console.log(
      JSON.stringify({
        type: 'request',
        method,
        url,
        body: sanitizedBody,
        timestamp: new Date().toISOString(),
      }),
    );

    return next.handle().pipe(
      tap((response) => {
        // Log response
        console.log(
          JSON.stringify({
            type: 'response',
            method,
            url,
            response,
            duration: `${Date.now() - now}ms`,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  }
}
