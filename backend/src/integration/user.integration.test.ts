import express from 'express';
import request from 'supertest';
import userRoutes from '@/routes/user';
import { errorHandler } from '@/utils/errors';
import { query } from '@/utils/database';

jest.mock('@/utils/database', () => ({
  query: jest.fn(),
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: req.get('x-test-user-id') || 'u-1',
      email: 'user@example.com',
      role: req.get('x-test-role') || 'user',
    };
    next();
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/user', userRoutes);
  app.use(errorHandler);
  return app;
};

describe('User preferences routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/user/preferences returns hasPreferences=false when no record', async () => {
    (query as jest.Mock).mockResolvedValue({ rows: [] });

    const app = makeApp();
    const res = await request(app).get('/api/user/preferences');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hasPreferences: false });
  });

  it('GET /api/user/preferences returns preferences payload when record exists', async () => {
    (query as jest.Mock).mockResolvedValue({
      rows: [
        {
          last_frame_id: 'f-1',
          last_year: 1910,
          last_lat: 10.5,
          last_lng: -70.2,
          last_zoom: 5,
        },
      ],
    });

    const app = makeApp();
    const res = await request(app).get('/api/user/preferences');

    expect(res.status).toBe(200);
    expect(res.body.hasPreferences).toBe(true);
    expect(res.body.preferences.last_frame_id).toBe('f-1');
  });

  it('POST /api/user/preferences upserts payload', async () => {
    (query as jest.Mock).mockResolvedValue({ rowCount: 1 });

    const app = makeApp();
    const res = await request(app)
      .post('/api/user/preferences')
      .send({
        last_frame_id: 'f-2',
        last_year: 1944,
        last_lat: 41.4,
        last_lng: 2.1,
        last_zoom: 7,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(query).toHaveBeenCalled();
  });

  it('POST /api/user/preferences validates integer fields', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/user/preferences')
      .send({ last_year: '1944' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
