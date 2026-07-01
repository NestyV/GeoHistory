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
export declare class AppError extends Error {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, unknown> | undefined);
    toJSON(): Omit<ErrorDetails, 'timestamp' | 'path'>;
}
/**
 * 400 Bad Request - Invalid input
 */
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
/**
 * 403 Forbidden - Insufficient permissions
 */
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
/**
 * 404 Not Found - Resource does not exist
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
/**
 * 409 Conflict - Resource state conflict (e.g., duplicate)
 */
export declare class ConflictError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * 422 Unprocessable Entity - Business logic validation failed
 */
export declare class UnprocessableEntityError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * 429 Too Many Requests - Rate limited
 */
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
/**
 * 500 Internal Server Error
 */
export declare class InternalServerError extends AppError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Format error for HTTP response
 */
export declare const formatErrorResponse: (error: AppError | Error, path?: string) => ErrorDetails;
/**
 * Express error handler middleware
 */
export declare const errorHandler: (err: any, req: any, res: Response, _next: any) => void;
//# sourceMappingURL=errors.d.ts.map