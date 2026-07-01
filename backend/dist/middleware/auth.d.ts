/**
 * JWT Authentication Middleware
 * Validates access tokens and attaches user to request
 * See specs/Security.md § 1.1-1.2 for auth specifications
 */
import { Request, Response, NextFunction } from 'express';
import { User } from '@/types';
import { Logger } from '@/utils/logger';
declare global {
    namespace Express {
        interface Request {
            user?: Omit<User, 'password_hash'>;
            token?: string;
            logger?: Logger;
        }
    }
}
/**
 * Middleware: Authenticate and attach user to request
 * Returns 401 if token is missing or invalid
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware: Optional authentication
 * Extracts user if token present, but doesn't fail if missing
 */
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware: Check user role
 * Returns 403 if user does not have required role
 */
export declare const requireRole: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware: Validate token in Authorization header (optional)
 * Used for endpoints that accept tokens but don't require auth
 */
export declare const validateTokenFormat: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map