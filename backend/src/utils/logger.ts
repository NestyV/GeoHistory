/**
 * Structured logging utility
 * JSON-formatted logs for all levels
 * See specs/Operations.md § 4 for logging specifications
 */

import { LogEntry } from '@/types';
import { config } from '@/config';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Get current log level threshold
 */
const getCurrentLogLevel = (): number => {
  const level = (config.logging.level || 'info') as LogLevel;
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
};

/**
 * Generate request ID for tracing (UUID-like)
 */
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format timestamp in ISO 8601
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Core logging function
 */
const log = (level: LogLevel, message: string, metadata?: Record<string, unknown>): void => {
  // Check if log level is enabled
  if (LOG_LEVELS[level] < getCurrentLogLevel()) {
    return;
  }

  const logEntry: LogEntry = {
    level,
    message,
    timestamp: getTimestamp(),
  };

  if (metadata) {
    logEntry.metadata = metadata;
  }

  // Output format based on config
  if (config.logging.format === 'json') {
    console.log(JSON.stringify(logEntry));
  } else {
    const { timestamp, level: lvl, message: msg, metadata: meta } = logEntry;
    console.log(`[${timestamp}] ${lvl.toUpperCase()}: ${msg}`, meta ? JSON.stringify(meta) : '');
  }
};

/**
 * Logger singleton with context
 */
export class Logger {
  private requestId: string;
  private userId: string | undefined;

  constructor(requestId?: string, userId?: string) {
    this.requestId = requestId || generateRequestId();
    this.userId = userId;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    log('debug', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    log('info', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    log('warn', message, { ...metadata, request_id: this.requestId, user_id: this.userId });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const errorData = error
      ? {
          code: error.name,
          message: error.message,
          stack: config.isDevelopment ? error.stack : undefined,
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

/**
 * Express middleware to attach logger to request
 */
export const createLoggerMiddleware = () => {
  return (req: any, res: any, next: any): void => {
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
    res.send = function (data: any): any {
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

/**
 * Default logger instance for non-request contexts
 */
export const defaultLogger = new Logger();
