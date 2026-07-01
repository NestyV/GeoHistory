"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = require("./AuthService");
const errors_1 = require("@/utils/errors");
const isTokenActiveMock = jest.fn();
jest.mock('@/repositories/RefreshTokenRepository', () => ({
    refreshTokenRepository: {
        isTokenActive: (...args) => isTokenActiveMock(...args),
        revokeToken: jest.fn(),
        createToken: jest.fn(),
    },
}));
describe('AuthService token methods', () => {
    beforeEach(() => {
        isTokenActiveMock.mockReset();
    });
    it('generates and verifies access token', () => {
        const token = AuthService_1.authService.generateAccessToken('user-1', 'user@example.com', 'user');
        const payload = AuthService_1.authService.verifyToken(token);
        expect(payload.sub).toBe('user-1');
        expect(payload.email).toBe('user@example.com');
        expect(payload.role).toBe('user');
    });
    it('accepts active refresh token', async () => {
        isTokenActiveMock.mockResolvedValue(true);
        const refresh = AuthService_1.authService.generateRefreshToken('user-2', 'curator@example.com', 'curator');
        const payload = await AuthService_1.authService.verifyRefreshToken(refresh);
        expect(payload.sub).toBe('user-2');
        expect(payload.role).toBe('curator');
        expect(payload.type).toBe('refresh');
    });
    it('rejects revoked refresh token', async () => {
        isTokenActiveMock.mockResolvedValue(false);
        const refresh = AuthService_1.authService.generateRefreshToken('user-3', 'admin@example.com', 'super_user');
        await expect(AuthService_1.authService.verifyRefreshToken(refresh)).rejects.toBeInstanceOf(errors_1.AuthenticationError);
    });
});
//# sourceMappingURL=AuthService.test.js.map