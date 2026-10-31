import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = String(res.locals.requestId ?? req.header('x-request-id') ?? 'unknown');
  const appError = error instanceof AppError ? error : null;
  const message = appError?.message ?? (error instanceof Error ? error.message : 'Internal server error.');
  console.error(`[${requestId}] ${message}`, error);
  res.status(appError?.statusCode ?? 500).json({
    error: {
      code: appError?.code ?? 'INTERNAL_ERROR',
      message,
      requestId,
    },
  });
};
