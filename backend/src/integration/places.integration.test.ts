import express from 'express';
import request from 'supertest';
import placesRoutes from '@/routes/places';
import { errorHandler } from '@/utils/errors';
import { placeService } from '@/services/PlaceService';

jest.mock('@/services/PlaceService', () => ({
  placeService: {
    getAllPlaces: jest.fn(),
    searchPlaces: jest.fn(),
    getPlacesByBounds: jest.fn(),
    getNearbyPlaces: jest.fn(),
    getPlaceById: jest.fn(),
    createPlace: jest.fn(),
    updatePlace: jest.fn(),
    deletePlace: jest.fn(),
  },
}));

jest.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: req.get('x-test-user-id') || 'u-1',
      email: 'curator@example.com',
      role: req.get('x-test-role') || 'curator',
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
  app.use('/api/places', placesRoutes);
  app.use(errorHandler);
  return app;
};

describe('Places routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/places returns 400 for invalid coordinates', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/places')
      .set('x-test-role', 'curator')
      .send({
        place_type_id: 'pt-1',
        current_name: 'Invalid Place',
        lat: -95,
        lng: 10,
      });

    expect(res.status).toBe(400);
    expect(placeService.createPlace).not.toHaveBeenCalled();
  });

  it('POST /api/places creates place with valid payload', async () => {
    (placeService.createPlace as jest.Mock).mockResolvedValue({ id: 'p-1', name: 'Asuncion' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/places')
      .set('x-test-role', 'curator')
      .send({
        place_type_id: 'pt-1',
        current_name: 'Asuncion',
        lat: -25.2,
        lng: -57.6,
      });

    expect(res.status).toBe(201);
    expect(placeService.createPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        place_type_id: 'pt-1',
        current_name: 'Asuncion',
        lat: -25.2,
        lng: -57.6,
      }),
      expect.objectContaining({ role: 'curator' }),
    );
  });

  it('GET /api/places/nearby returns 400 for invalid coordinates', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/places/nearby?lat=abc&lng=-57.6&radius=10');

    expect(res.status).toBe(400);
    expect(placeService.getNearbyPlaces).not.toHaveBeenCalled();
  });

  it('GET /api/places/bounds returns 400 for invalid bounds values', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/places/bounds?minLat=0&maxLat=10&minLon=foo&maxLon=20');

    expect(res.status).toBe(400);
    expect(placeService.getPlacesByBounds).not.toHaveBeenCalled();
  });
});
