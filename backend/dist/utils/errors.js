"use strict";
/**
 * Custom error classes for API responses
 * Standardized error handling across backend
 * See specs/Security.md § 2.2 for error response format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.formatErrorResponse = exports.InternalServerError = exports.RateLimitError = exports.UnprocessableEntityError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base AppError class for all application errors
 */
class AppError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    toJSON() {
        const response = {
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
exports.AppError = AppError;
/**
 * 400 Bad Request - Invalid input
 */
class ValidationError extends AppError {
    constructor(message, details) {
        super('VALIDATION_ERROR', message, 400, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * 401 Unauthorized - Missing or invalid authentication
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super('AUTHENTICATION_ERROR', message, 401);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * 403 Forbidden - Insufficient permissions
 */
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super('AUTHORIZATION_ERROR', message, 403);
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * 404 Not Found - Resource does not exist
 */
class NotFoundError extends AppError {
    constructor(resource, id) {
        const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
        super('NOT_FOUND', message, 404);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict - Resource state conflict (e.g., duplicate)
 */
class ConflictError extends AppError {
    constructor(message, details) {
        super('CONFLICT', message, 409, details);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 Unprocessable Entity - Business logic validation failed
 */
class UnprocessableEntityError extends AppError {
    constructor(message, details) {
        super('UNPROCESSABLE_ENTITY', message, 422, details);
        Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
/**
 * 429 Too Many Requests - Rate limited
 */
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super('RATE_LIMITED', 'Too many requests', 429, retryAfter ? { retry_after_seconds: retryAfter } : undefined);
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * 500 Internal Server Error
 */
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', details) {
        super('INTERNAL_SERVER_ERROR', message, 500, details);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Format error for HTTP response
 */
const formatErrorResponse = (error, path) => {
    if (error instanceof AppError) {
        const response = {
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
    const fallback = {
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
exports.formatErrorResponse = formatErrorResponse;
/**
 * Express error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
    const logger = req.logger;
    const path = req.path;
    // Log error
    if (logger) {
        if (err instanceof AppError && err.statusCode < 500) {
            logger.warn(`${err.code}: ${err.message}`, { path });
        }
        else {
            logger.error('Unhandled error', err, { path });
        }
    }
    // Determine response
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const response = (0, exports.formatErrorResponse)(err instanceof AppError ? err : new InternalServerError(err.message), path);
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errors.js.map