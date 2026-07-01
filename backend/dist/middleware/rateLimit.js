"use strict";
/**
 * Rate limit middleware factories
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRateLimiter = exports.createGlobalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("@/config");
const createGlobalRateLimiter = () => (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
exports.createGlobalRateLimiter = createGlobalRateLimiter;
const createAuthRateLimiter = () => (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.sensitiveEndpointLimit,
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
});
exports.createAuthRateLimiter = createAuthRateLimiter;
//# sourceMappingURL=rateLimit.js.map