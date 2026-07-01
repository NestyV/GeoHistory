"use strict";
/**
 * JWT Authentication Middleware
 * Validates access tokens and attaches user to request
 * See specs/Security.md § 1.1-1.2 for auth specifications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTokenFormat = exports.requireRole = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
/**
 * Extract JWT from Authorization header or cookies
 */
const extractToken = (req) => {
    // Check Authorization header (Bearer token)
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // Check httpOnly cookie
    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    return null;
};
/**
 * Verify JWT and extract payload
 */
const verifyToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        return payload;
    }
    catch (error) {
        return null;
    }
};
/**
 * Middleware: Authenticate and attach user to request
 * Returns 401 if token is missing or invalid
 */
const authenticate = (req, res, next) => {
    const logger = req.logger || new logger_1.Logger();
    const token = extractToken(req);
    if (!token) {
        logger.warn('Missing authentication token', { path: req.path });
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authentication token',
            status_code: 401,
            timestamp: new Date().toISOString(),
            path: req.path,
        });
        return;
    }
    const payload = verifyToken(token);
    if (!payload) {
        logger.warn('Invalid or expired token', { path: req.path });
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired authentication token',
            status_code: 401,
            timestamp: new Date().toISOString(),
            path: req.path,
        });
        return;
    }
    // Attach user info to request
    req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
    };
    req.token = token;
    logger.debug('User authenticated', { user_id: payload.sub, role: payload.role });
    next();
};
exports.authenticate = authenticate;
/**
 * Middleware: Optional authentication
 * Extracts user if token present, but doesn't fail if missing
 */
const optionalAuth = (req, _res, next) => {
    const token = extractToken(req);
    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            req.user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };
            req.token = token;
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware: Check user role
 * Returns 403 if user does not have required role
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const logger = req.logger || new logger_1.Logger();
        if (!req.user) {
            logger.warn('Access denied: not authenticated', { path: req.path });
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
                status_code: 401,
                timestamp: new Date().toISOString(),
                path: req.path,
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            logger.warn('Access denied: insufficient role', {
                user_id: req.user.id,
                user_role: req.user.role,
                required_roles: allowedRoles,
                path: req.path,
            });
            res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
                status_code: 403,
                timestamp: new Date().toISOString(),
                path: req.path,
            });
            return;
        }
        logger.debug('Role check passed', { user_role: req.user.role });
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Middleware: Validate token in Authorization header (optional)
 * Used for endpoints that accept tokens but don't require auth
 */
const validateTokenFormat = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (authHeader && !authHeader.startsWith('Bearer ')) {
        const logger = req.logger || new logger_1.Logger();
        logger.warn('Invalid authorization header format', { path: req.path });
        res.status(400).json({
            error: 'Bad Request',
            message: 'Authorization header must use Bearer scheme',
            status_code: 400,
            timestamp: new Date().toISOString(),
            path: req.path,
        });
        return;
    }
    next();
};
exports.validateTokenFormat = validateTokenFormat;
//# sourceMappingURL=auth.js.map