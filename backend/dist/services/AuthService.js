"use strict";
/**
 * Auth Service
 * Handles user registration, login, token generation and refresh token revocation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const UserRepository_1 = require("@/repositories/UserRepository");
const RefreshTokenRepository_1 = require("@/repositories/RefreshTokenRepository");
const config_1 = require("@/config");
const errors_1 = require("@/utils/errors");
const normalizeRole = (role) => {
    if (role === 'curator' || role === 'super_user') {
        return role;
    }
    return 'user';
};
const toSafeUser = (user) => {
    const { password_hash, ...safe } = user;
    return {
        ...safe,
        role: normalizeRole(user.role),
    };
};
class AuthService {
    async register(email, password, fullName) {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
            throw new errors_1.ValidationError('Invalid email format');
        }
        if (!password || password.length < 8) {
            throw new errors_1.ValidationError('Password must be at least 8 characters long');
        }
        const existingUser = await UserRepository_1.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const createdUser = await UserRepository_1.userRepository.create({
            email: normalizedEmail,
            password_hash: passwordHash,
            full_name: fullName?.trim() || null,
            role: 'regular',
            created_at: new Date(),
            updated_at: new Date(),
        });
        const safeUser = toSafeUser(createdUser);
        const accessToken = this.generateAccessToken(safeUser.id, safeUser.email, safeUser.role);
        const refreshToken = this.generateRefreshToken(safeUser.id, safeUser.email, safeUser.role);
        await this.persistRefreshToken(refreshToken, safeUser.id);
        return { user: safeUser, accessToken, refreshToken };
    }
    async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserRepository_1.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        const safeUser = toSafeUser(user);
        const accessToken = this.generateAccessToken(safeUser.id, safeUser.email, safeUser.role);
        const refreshToken = this.generateRefreshToken(safeUser.id, safeUser.email, safeUser.role);
        await this.persistRefreshToken(refreshToken, safeUser.id);
        return { user: safeUser, accessToken, refreshToken };
    }
    verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
            return payload;
        }
        catch (error) {
            throw new errors_1.AuthenticationError('Invalid or expired token');
        }
    }
    generateAccessToken(userId, email, role) {
        const payload = {
            sub: userId,
            id: userId,
            email,
            role,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessSecret, {
            expiresIn: config_1.config.jwt.accessExpiresIn,
        });
    }
    generateRefreshToken(userId, email, role) {
        const payload = {
            sub: userId,
            id: userId,
            email,
            role,
            type: 'refresh',
            jti: (0, crypto_1.randomUUID)(),
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.refreshSecret, {
            expiresIn: config_1.config.jwt.refreshExpiresIn,
        });
    }
    async verifyRefreshToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret);
            if (payload.type !== 'refresh') {
                throw new errors_1.AuthenticationError('Invalid token type');
            }
            const isActive = await RefreshTokenRepository_1.refreshTokenRepository.isTokenActive(payload.jti);
            if (!isActive) {
                throw new errors_1.AuthenticationError('Refresh token revoked');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof errors_1.AuthenticationError) {
                throw error;
            }
            throw new errors_1.AuthenticationError('Invalid or expired refresh token');
        }
    }
    async revokeRefreshToken(tokenId, replacedByTokenId) {
        await RefreshTokenRepository_1.refreshTokenRepository.revokeToken(tokenId, replacedByTokenId);
    }
    async persistRefreshToken(token, userId) {
        const payload = jsonwebtoken_1.default.decode(token);
        if (!payload || !payload.jti || !payload.exp) {
            throw new errors_1.AuthenticationError('Could not decode refresh token');
        }
        await RefreshTokenRepository_1.refreshTokenRepository.createToken({
            userId,
            tokenId: payload.jti,
            expiresAt: new Date(payload.exp * 1000),
            tokenHash: this.hashToken(token),
        });
    }
    hashToken(token) {
        // Store a digest so raw refresh tokens are never persisted.
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=AuthService.js.map