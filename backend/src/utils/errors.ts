/**
 * Custom error classes for API responses
 * Standardized error handling across backend
 * See specs/Security.md § 2.2 for error response format
 */

import { Response } from 'express';

export interface ErrorDetails {
  code: string;
  message: string;
  status_code: number;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

/**
 * Base AppError class for all application errors
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): Omit<ErrorDetails, 'timestamp' | 'path'> {
    const response: Omit<ErrorDetails, 'timestamp' | 'path'> = {
      code: this.code,
      message: this.message,
      status_code: this.statusCode,
    };

    if (this.details) {
      response.details = this.details;
    }

    return response;
  }
}

/**
 * 400 Bad Request - Invalid input
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', message, 401);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super('NOT_FOUND', message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Resource state conflict (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity - Business logic validation failed
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('UNPROCESSABLE_ENTITY', message, 422, details);
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * 429 Too Many Requests - Rate limited
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Too many requests', 429, retryAfter ? { retry_after_seconds: retryAfter } : undefined);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super('INTERNAL_SERVER_ERROR', message, 500, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Format error for HTTP response
 */
export const formatErrorResponse = (error: AppError | Error, path?: string): ErrorDetails => {
  if (error instanceof AppError) {
    const response: ErrorDetails = {
      code: error.code,
      message: error.message,
      status_code: error.statusCode,
      timestamp: new Date().toISOString(),
    };

    if (path) {
      response.path = path;
    }
    if (error.details) {
      response.details = error.details;
    }

    return response;
  }

  const fallback: ErrorDetails = {
    code: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    status_code: 500,
    timestamp: new Date().toISOString(),
  };

  if (path) {
    fallback.path = path;
  }

  return fallback;
};

/**
 * Express error handler middleware
 */
export const errorHandler = (err: any, req: any, res: Response, _next: any) => {
  const logger = req.logger;
  const path = req.path;

  // Log error
  if (logger) {
    if (err instanceof AppError && err.statusCode < 500) {
      logger.warn(`${err.code}: ${err.message}`, { path });
    } else {
      logger.error('Unhandled error', err, { path });
    }
  }

  // Determine response
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const response = formatErrorResponse(err instanceof AppError ? err : new InternalServerError(err.message), path);

  res.status(statusCode).json(response);
};
