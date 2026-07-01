/**
 * Auth Service
 * Handles user registration, login, token generation and refresh token revocation.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import { userRepository } from '@/repositories/UserRepository';
import { refreshTokenRepository } from '@/repositories/RefreshTokenRepository';
import { config } from '@/config';
import { AuthenticationError, ConflictError, ValidationError } from '@/utils/errors';
import { User } from '@/types';

type SafeUser = Omit<User, 'password_hash'> & { role: 'user' | 'curator' | 'super_user' };

interface AccessTokenPayload {
  sub: string;
  id: string;
  email: string;
  role: 'user' | 'curator' | 'super_user';
}

interface RefreshTokenPayload extends AccessTokenPayload {
  type: 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

const normalizeRole = (role: string): 'user' | 'curator' | 'super_user' => {
  if (role === 'curator' || role === 'super_user') {
    return role;
  }
  return 'user';
};

const toSafeUser = (user: User): SafeUser => {
  const { password_hash, ...safe } = user;
  return {
    ...safe,
    role: normalizeRole(user.role),
  };
};

export class AuthService {
  async register(email: string, password: string, fullName?: string): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new ValidationError('Invalid email format');
    }

    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await userRepository.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName?.trim() || null,
      role: 'regular' as any,
      created_at: new Date(),
      updated_at: new Date(),
    } as Partial<User>);

    const safeUser = toSafeUser(createdUser);
    const accessToken = this.generateAccessToken(safeUser.id, safeUser.email, safeUser.role);
    const refreshToken = this.generateRefreshToken(safeUser.id, safeUser.email, safeUser.role);
    await this.persistRefreshToken(refreshToken, safeUser.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const safeUser = toSafeUser(user);
    const accessToken = this.generateAccessToken(safeUser.id, safeUser.email, safeUser.role);
    const refreshToken = this.generateRefreshToken(safeUser.id, safeUser.email, safeUser.role);
    await this.persistRefreshToken(refreshToken, safeUser.id);

    return { user: safeUser, accessToken, refreshToken };
  }

  verifyToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  generateAccessToken(userId: string, email: string, role: 'user' | 'curator' | 'super_user'): string {
    const payload: AccessTokenPayload = {
      sub: userId,
      id: userId,
      email,
      role,
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);
  }

  generateRefreshToken(userId: string, email: string, role: 'user' | 'curator' | 'super_user'): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      id: userId,
      email,
      role,
      type: 'refresh',
      jti: randomUUID(),
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      const isActive = await refreshTokenRepository.isTokenActive(payload.jti);
      if (!isActive) {
        throw new AuthenticationError('Refresh token revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  async revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void> {
    await refreshTokenRepository.revokeToken(tokenId, replacedByTokenId);
  }

  async persistRefreshToken(token: string, userId: string): Promise<void> {
    const payload = jwt.decode(token) as RefreshTokenPayload | null;

    if (!payload || !payload.jti || !payload.exp) {
      throw new AuthenticationError('Could not decode refresh token');
    }

    await refreshTokenRepository.createToken({
      userId,
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
      tokenHash: this.hashToken(token),
    });
  }

  private hashToken(token: string): string {
    // Store a digest so raw refresh tokens are never persisted.
    return createHash('sha256').update(token).digest('hex');
  }
}

export const authService = new AuthService();
