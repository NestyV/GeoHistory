"use strict";
/**
 * Structured logging utility
 * JSON-formatted logs for all levels
 * See specs/Operations.md § 4 for logging specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.createLoggerMiddleware = exports.Logger = void 0;
const config_1 = require("@/config");
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
/**
 * Get current log level threshold
 */
const getCurrentLogLevel = () => {
    const level = (config_1.config.logging.level || 'info');
    return LOG_LEVELS[level] ?? LOG_LEVELS.info;
};
/**
 * Generate request ID for tracing (UUID-like)
 */
const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
/**
 * Format timestamp in ISO 8601
 */
const getTimestamp = () => {
    return new Date().toISOString();
};
/**
 * Core logging function
 */
const log = (level, message, metadata) => {
    // Check if log level is enabled
    if (LOG_LEVELS[level] < getCurrentLogLevel()) {
        return;
    }
    const logEntry = {
        level,
        message,
        timestamp: getTimestamp(),
    };
    if (metadata) {
        logEntry.metadata = metadata;
    }
    // Output format based on config
    if (config_1.config.logging.format === 'json') {
        console.log(JSON.stringify(logEntry));
    }
    else {
        const { timestamp, level: lvl, message: msg, metadata: meta } = logEntry;
        console.log(`[${timestamp}] ${lvl.toUpperCase()}: ${msg}`, meta ? JSON.stringify(meta) : '');
    }
};
/**
 * Logger singleton with context
 */
class Logger {
    constructor(requestId, userId) {
        this.requestId = requestId || generateRequestId();
        this.userId = userId;
    }
    debug(message, metadata) {
        log('debug', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
    }
    info(message, metadata) {
        log('info', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
    }
    warn(message, metadata) {
        log('warn', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
    }
    error(message, error, metadata) {
        const errorData = error
            ? {
                code: error.name,
                message: error.message,
                stack: config_1.config.isDevelopment ? error.stack : undefined,
            }
            : undefined;
        log('error', message, {
            ...metadata,
            request_id: this.requestId,
            user_id: this.userId,
            error: errorData,
        });
    }
}
exports.Logger = Logger;
/**
 * Express middleware to attach logger to request
 */
const createLoggerMiddleware = () => {
    return (req, res, next) => {
        const requestId = req.get('x-request-id') || generateRequestId();
        const userId = req.user?.id;
        req.logger = new Logger(requestId, userId);
        req.requestId = requestId;
        // Log incoming request
        req.logger.info('Incoming request', {
            method: req.method,
            path: req.path,
            ip: req.ip,
        });
        // Log response on completion
        const originalSend = res.send;
        res.send = function (data) {
            req.logger.info('Request completed', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
            });
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.createLoggerMiddleware = createLoggerMiddleware;
/**
 * Default logger instance for non-request contexts
 */
exports.defaultLogger = new Logger();
//# sourceMappingURL=logger.js.map