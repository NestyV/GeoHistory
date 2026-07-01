import express from 'express';
import request from 'supertest';
import eventsRoutes from '@/routes/events';
import { errorHandler } from '@/utils/errors';
import { eventService } from '@/services/EventService';
import { eventRepository } from '@/repositories/EventRepository';

jest.mock('@/services/EventService', () => ({
  eventService: {
    getAllApprovedEvents: jest.fn(),
    getEventById: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    approveEvent: jest.fn(),
    rejectEvent: jest.fn(),
  },
}));

jest.mock('@/repositories/EventRepository', () => ({
  eventRepository: {
    findByUserId: jest.fn(),
  },
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
  app.use('/api/events', eventsRoutes);
  app.use(errorHandler);
  return app;
};

describe('Events routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/events creates an event for authenticated user', async () => {
    (eventService.createEvent as jest.Mock).mockResolvedValue({ id: 'event-1', status: 'pending' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Test Event',
        event_date: '2026-01-01',
        location: 'Somewhere',
        lat: 1,
        lng: 2,
      });

    expect(res.status).toBe(201);
    expect(eventService.createEvent).toHaveBeenCalled();
  });

  it('POST /api/events returns 400 for invalid coordinates', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Test Event',
        event_date: '2026-01-01',
        lat: 120,
        lng: 2,
      });

    expect(res.status).toBe(400);
    expect(eventService.createEvent).not.toHaveBeenCalled();
  });

  it('POST /api/events/:id/approve rejects non-curator role', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/events/event-1/approve')
      .set('x-test-role', 'user');

    expect(res.status).toBe(403);
  });

  it('POST /api/events/:id/approve allows curator role', async () => {
    (eventService.approveEvent as jest.Mock).mockResolvedValue({ id: 'event-1', status: 'approved' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/events/event-1/approve')
      .set('x-test-role', 'curator');

    expect(res.status).toBe(200);
    expect(eventService.approveEvent).toHaveBeenCalled();
  });

  it('POST /api/events/:id/approve allows super_user role', async () => {
    (eventService.approveEvent as jest.Mock).mockResolvedValue({ id: 'event-1', status: 'approved' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/events/event-1/approve')
      .set('x-test-role', 'super_user');

    expect(res.status).toBe(200);
    expect(eventService.approveEvent).toHaveBeenCalled();
  });

  it('POST /api/events/:id/reject rejects non-curator role', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/events/event-1/reject')
      .set('x-test-role', 'user')
      .send({ reason: 'invalid' });

    expect(res.status).toBe(403);
  });

  it('GET /api/events/my returns authenticated user events', async () => {
    (eventRepository.findByUserId as jest.Mock).mockResolvedValue([{ id: 'event-1', user_id: 'u-1' }]);

    const app = makeApp();
    const res = await request(app)
      .get('/api/events/my')
      .set('x-test-user-id', 'u-1');

    expect(res.status).toBe(200);
    expect(eventRepository.findByUserId).toHaveBeenCalledWith('u-1');
    expect(res.body).toEqual([{ id: 'event-1', user_id: 'u-1' }]);
  });

  it('GET /api/events returns 400 for invalid pagination limit', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/events?limit=0');

    expect(res.status).toBe(400);
    expect(eventService.getAllApprovedEvents).not.toHaveBeenCalled();
  });
});
