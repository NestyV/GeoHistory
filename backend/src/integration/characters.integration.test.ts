import express from 'express';
import request from 'supertest';
import charactersRoutes from '@/routes/characters';
import { errorHandler } from '@/utils/errors';
import { characterService } from '@/services/CharacterService';

jest.mock('@/services/CharacterService', () => ({
  characterService: {
    getAllCharacters: jest.fn(),
    searchCharacters: jest.fn(),
    getCharactersAliveInYear: jest.fn(),
    getCharacter: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
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
  app.use('/api/characters', charactersRoutes);
  app.use(errorHandler);
  return app;
};

describe('Characters routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/characters returns 400 when name is missing', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/characters')
      .set('x-test-role', 'curator')
      .send({ description: 'No name' });

    expect(res.status).toBe(400);
    expect(characterService.createCharacter).not.toHaveBeenCalled();
  });

  it('POST /api/characters creates character for curator payload', async () => {
    (characterService.createCharacter as jest.Mock).mockResolvedValue({ id: 'c-1', name: 'Ada' });

    const app = makeApp();
    const res = await request(app)
      .post('/api/characters')
      .set('x-test-role', 'curator')
      .send({ name: 'Ada', alias: 'A.', description: 'Test' });

    expect(res.status).toBe(201);
    expect(characterService.createCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada', alias: 'A.', description: 'Test' }),
      expect.objectContaining({ role: 'curator' }),
    );
  });
});
