/**
 * Rate limit middleware factories
 */

import rateLimit from 'express-rate-limit';
import { config } from '@/config';

export const createGlobalRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

export const createAuthRateLimiter = () =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.sensitiveEndpointLimit,
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
  });
