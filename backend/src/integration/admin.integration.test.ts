import express from 'express';
import request from 'supertest';
import adminRoutes from '@/routes/admin';
import { errorHandler } from '@/utils/errors';
import { adminService } from '@/services/AdminService';

jest.mock('@/services/AdminService', () => ({
  adminService: {
    getAllUsers: jest.fn(),
    updateUserRole: jest.fn(),
  },
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: req.get('x-test-user-id') || 'u-1',
      email: 'admin@example.com',
      role: req.get('x-test-role') || 'user',
    };
    next();
  },
  requireRole: (...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    };
  },
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  return app;
};

describe('Admin routes integration', () => {
  beforeEach(() => {
    (adminService.getAllUsers as jest.Mock).mockReset();
    (adminService.updateUserRole as jest.Mock).mockReset();
  });

  it('GET /api/admin/users rejects non-super_user', async () => {
    const app = makeApp();
    const res = await request(app)
      .get('/api/admin/users')
      .set('x-test-role', 'curator');

    expect(res.status).toBe(403);
  });

  it('GET /api/admin/users allows super_user', async () => {
    (adminService.getAllUsers as jest.Mock).mockResolvedValue({
      users: [{ id: 'u-1', email: 'user@example.com', role: 'regular' }],
      total: 1,
    });

    const app = makeApp();
    const res = await request(app)
      .get('/api/admin/users')
      .set('x-test-role', 'super_user');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(adminService.getAllUsers).toHaveBeenCalledWith(20, 0);
  });

  it('PUT /api/admin/users/:id/role rejects non-super_user', async () => {
    const app = makeApp();
    const res = await request(app)
      .put('/api/admin/users/u-2/role')
      .set('x-test-role', 'curator')
      .send({ role: 'curator' });

    expect(res.status).toBe(403);
  });

  it('PUT /api/admin/users/:id/role allows super_user', async () => {
    (adminService.updateUserRole as jest.Mock).mockResolvedValue({
      id: 'u-2',
      email: 'promoted@example.com',
      role: 'curator',
    });

    const app = makeApp();
    const res = await request(app)
      .put('/api/admin/users/u-2/role')
      .set('x-test-role', 'super_user')
      .send({ role: 'curator' });

    expect(res.status).toBe(200);
    expect(adminService.updateUserRole).toHaveBeenCalledWith(
      'u-2',
      'curator',
      expect.objectContaining({ role: 'super_user' }),
    );
  });
});
