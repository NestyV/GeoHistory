/**
 * Structured logging utility
 * JSON-formatted logs for all levels
 * See specs/Operations.md § 4 for logging specifications
 */
/**
 * Logger singleton with context
 */
export declare class Logger {
    private requestId;
    private userId;
    constructor(requestId?: string, userId?: string);
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
}
/**
 * Express middleware to attach logger to request
 */
export declare const createLoggerMiddleware: () => (req: any, res: any, next: any) => void;
/**
 * Default logger instance for non-request contexts
 */
export declare const defaultLogger: Logger;
//# sourceMappingURL=logger.d.ts.map