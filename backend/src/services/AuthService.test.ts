import { authService } from './AuthService';
import { AuthenticationError } from '@/utils/errors';

const isTokenActiveMock = jest.fn();

jest.mock('@/repositories/RefreshTokenRepository', () => ({
  refreshTokenRepository: {
    isTokenActive: (...args: any[]) => isTokenActiveMock(...args),
    revokeToken: jest.fn(),
    createToken: jest.fn(),
  },
}));

describe('AuthService token methods', () => {
  beforeEach(() => {
    isTokenActiveMock.mockReset();
  });

  it('generates and verifies access token', () => {
    const token = authService.generateAccessToken('user-1', 'user@example.com', 'user');
    const payload = authService.verifyToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
    expect(payload.role).toBe('user');
  });

  it('accepts active refresh token', async () => {
    isTokenActiveMock.mockResolvedValue(true);

    const refresh = authService.generateRefreshToken('user-2', 'curator@example.com', 'curator');
    const payload = await authService.verifyRefreshToken(refresh);

    expect(payload.sub).toBe('user-2');
    expect(payload.role).toBe('curator');
    expect(payload.type).toBe('refresh');
  });

  it('rejects revoked refresh token', async () => {
    isTokenActiveMock.mockResolvedValue(false);

    const refresh = authService.generateRefreshToken('user-3', 'admin@example.com', 'super_user');

    await expect(authService.verifyRefreshToken(refresh)).rejects.toBeInstanceOf(AuthenticationError);
  });
});
