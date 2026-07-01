import express from 'express';
import request from 'supertest';
import { validateTokenFormat } from '@/middleware/auth';
import healthRoutes from '@/routes/health';
import { errorHandler } from '@/utils/errors';

const makeApp = () => {
  const app = express();
  app.use(validateTokenFormat);
  app.use('/api', healthRoutes);
  app.use(errorHandler);
  return app;
};

describe('Security middleware integration', () => {
  it('returns 400 for non-Bearer authorization header format', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/api/health')
      .set('Authorization', 'Token abc123');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Authorization header must use Bearer scheme');
  });

  it('allows request with valid Bearer authorization format', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/api/health')
      .set('Authorization', 'Bearer fake-token');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
