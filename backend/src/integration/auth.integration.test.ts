import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import authRoutes from '@/routes/auth';
import { errorHandler } from '@/utils/errors';
import { authService } from '@/services/AuthService';

jest.mock('@/services/AuthService', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    persistRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  },
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'u-1', email: 'u@example.com', role: 'user' };
    next();
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth routes integration', () => {
  it('POST /api/auth/login returns token payload', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      user: { id: 'u-1', email: 'u@example.com', role: 'user' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const app = makeApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@example.com', password: 'Password1234' });

    const setCookieHeader = res.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookieHeader)
      ? setCookieHeader.join(';')
      : (setCookieHeader || '');

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('access-token');
    expect(cookieHeader).toContain('refreshToken=');
  });

  it('POST /api/auth/refresh-token rotates token', async () => {
    (authService.verifyRefreshToken as jest.Mock)
      .mockResolvedValueOnce({ sub: 'u-1', email: 'u@example.com', role: 'user', jti: 'old-jti', type: 'refresh' })
      .mockResolvedValueOnce({ sub: 'u-1', email: 'u@example.com', role: 'user', jti: 'new-jti', type: 'refresh' });
    (authService.generateAccessToken as jest.Mock).mockReturnValue('new-access');
    (authService.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh');

    const app = makeApp();
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refresh_token: 'old-refresh' });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('new-access');
    expect(authService.persistRefreshToken).toHaveBeenCalledWith('new-refresh', 'u-1');
    expect(authService.revokeRefreshToken).toHaveBeenCalledWith('old-jti', 'new-jti');
  });

  it('POST /api/auth/logout succeeds with auth middleware', async () => {
    (authService.verifyRefreshToken as jest.Mock).mockResolvedValue({
      sub: 'u-1',
      email: 'u@example.com',
      role: 'user',
      jti: 'token-jti',
      type: 'refresh',
    });

    const app = makeApp();
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refresh_token: 'refresh-token' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('POST /api/auth/refresh-token returns 400 when token is missing', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({});

    expect(res.status).toBe(400);
    expect(authService.verifyRefreshToken).not.toHaveBeenCalled();
  });
});
