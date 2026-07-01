/**
 * Authentication routes
 * Handles login, logout, and token refresh
 * See specs/Features.md § 3 for API contract details
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/auth';
import { ValidationError } from '@/utils/errors';
import { authService } from '@/services/AuthService';
import { validateEmailAndPassword } from '@/middleware/validation';

const router = Router();

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/api/auth',
};

const handleSignup = async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;

  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const { user, accessToken, refreshToken } = await authService.register(email, password, full_name);

    logger?.info('User registered', { user_id: user.id, email: user.email });

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(201).json({
      user,
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/signup
 * Register user account
 */
router.post('/signup', validateEmailAndPassword, handleSignup);

/**
 * POST /api/auth/register
 * Alias of /signup for API consistency
 */
router.post('/register', validateEmailAndPassword, handleSignup);

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 * Returns access and refresh tokens
 * See specs/Security.md § 1.1 for auth flow
 */
router.post('/login', validateEmailAndPassword, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;

  try {
    const { email, password } = req.body;

    logger?.debug('Login attempt', { email });

    // Input validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    const { user, accessToken, refreshToken } = await authService.login(email, password);

    logger?.info('Login successful', { user_id: user.id, email: user.email });

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(200).json({
      user,
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication tokens
 * Returns new access and refresh tokens
 * See specs/Security.md § 1.1 for token rotation
 */
const handleRefresh = async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;

  try {
    const refreshToken = req.body.refresh_token || req.cookies?.refreshToken;

    logger?.debug('Token refresh requested');

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const payload = await authService.verifyRefreshToken(refreshToken);

    const accessToken = authService.generateAccessToken(payload.sub, payload.email, payload.role);
    const newRefreshToken = authService.generateRefreshToken(payload.sub, payload.email, payload.role);

    await authService.persistRefreshToken(newRefreshToken, payload.sub);
    const newPayload = await authService.verifyRefreshToken(newRefreshToken);
    await authService.revokeRefreshToken(payload.jti, newPayload.jti);

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    logger?.info('Token refreshed', { user_id: payload.sub });

    res.status(200).json({
      token: accessToken,
      access_token: accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

router.post('/refresh', handleRefresh);
router.post('/refresh-token', handleRefresh);

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 * Requires authentication
 * See specs/Security.md § 1.1 for logout flow
 */
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;

  try {
    const refreshToken = req.body?.refresh_token || req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const payload = await authService.verifyRefreshToken(refreshToken);
        await authService.revokeRefreshToken(payload.jti);
      } catch (error) {
        logger?.warn('Refresh token could not be revoked during logout');
      }
    }

    res.clearCookie('refreshToken', refreshCookieOptions);

    logger?.info('Logout requested', { user_id: req.user?.id });

    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
