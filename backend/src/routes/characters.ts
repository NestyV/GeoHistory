/**
 * Characters API Routes
 * Fetch and search historical characters
 * See specs/Features.md § 3.3 for endpoint specifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';
import { characterService } from '@/services/CharacterService';
import { ValidationError } from '@/utils/errors';

const router = Router();

const validateCharacterPayload = (input: any, isPartial: boolean = false): Record<string, unknown> => {
  const output: Record<string, unknown> = {};

  const normalizeFrameIds = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      throw new ValidationError('Character frame_ids must be an array of strings');
    }

    const frameIds = value
      .filter((frameId): frameId is string => typeof frameId === 'string')
      .map((frameId) => frameId.trim())
      .filter((frameId) => frameId.length > 0);

    if (frameIds.length !== value.filter((frameId) => typeof frameId === 'string' && frameId.trim().length > 0).length) {
      throw new ValidationError('Character frame_ids must contain only non-empty strings');
    }

    return Array.from(new Set(frameIds));
  };

  if (!isPartial || input?.name !== undefined) {
    if (typeof input?.name !== 'string' || !input.name.trim()) {
      throw new ValidationError('Character name is required');
    }
    output.name = input.name.trim();
  }

  if (input?.description !== undefined) {
    if (input.description !== null && typeof input.description !== 'string') {
      throw new ValidationError('Character description must be a string');
    }
    output.description = input.description;
  }

  if (input?.alias !== undefined) {
    if (input.alias !== null && typeof input.alias !== 'string') {
      throw new ValidationError('Character alias must be a string or null');
    }
    output.alias = input.alias;
  }

  if (input?.image_url !== undefined) {
    if (input.image_url !== null && typeof input.image_url !== 'string') {
      throw new ValidationError('Character image_url must be a string or null');
    }
    output.image_url = input.image_url;
  }

  if (input?.face_crop_x !== undefined) {
    if (input.face_crop_x !== null && typeof input.face_crop_x !== 'number') {
      throw new ValidationError('Character face_crop_x must be a number or null');
    }
    output.face_crop_x = input.face_crop_x;
  }

  if (input?.face_crop_y !== undefined) {
    if (input.face_crop_y !== null && typeof input.face_crop_y !== 'number') {
      throw new ValidationError('Character face_crop_y must be a number or null');
    }
    output.face_crop_y = input.face_crop_y;
  }

  if (input?.face_crop_scale !== undefined) {
    if (input.face_crop_scale !== null && typeof input.face_crop_scale !== 'number') {
      throw new ValidationError('Character face_crop_scale must be a number or null');
    }
    output.face_crop_scale = input.face_crop_scale;
  }

  if (input?.face_crop_size !== undefined) {
    if (input.face_crop_size !== null && typeof input.face_crop_size !== 'number') {
      throw new ValidationError('Character face_crop_size must be a number or null');
    }
    output.face_crop_size = input.face_crop_size;
  }

  if (input?.frame_id !== undefined) {
    if (input.frame_id !== null && typeof input.frame_id !== 'string') {
      throw new ValidationError('Character frame_id must be a string or null');
    }
    const frameId = typeof input.frame_id === 'string' ? input.frame_id.trim() : null;
    output.frame_id = frameId || null;
    if (output.frame_ids === undefined) {
      output.frame_ids = frameId ? [frameId] : [];
    }
  }

  if (input?.frame_ids !== undefined) {
    const frameIds = normalizeFrameIds(input.frame_ids);
    output.frame_ids = frameIds;
    output.frame_id = frameIds[0] || null;
  }

  return output;
};

/**
 * GET /api/characters
 * List all characters with pagination
 * Public endpoint
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const frameId = typeof req.query.frame_id === 'string' && req.query.frame_id.trim().length > 0
      ? req.query.frame_id
      : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    const { characters, total } = await characterService.getAllCharacters(limit, offset, frameId);

    logger?.info('Characters listed', { count: characters.length, total });
    res.status(200).json({
      data: characters,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/characters/search/by-name
 * Search characters by name
 * Public endpoint
 */
router.get('/search/by-name', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ValidationError('Search query parameter "q" is required');
    }

    const characters = await characterService.searchCharacters(q);

    logger?.info('Characters searched', { search_term: q, count: characters.length });
    res.status(200).json({
      data: characters,
      search_term: q,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/characters/alive-in/:year
 * Get characters alive in specific year
 * Public endpoint
 */
router.get('/alive-in/:year', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { year: yearParam } = req.params;
    if (!yearParam) {
      throw new ValidationError('Year is required');
    }
    const year = parseInt(yearParam, 10);

    if (isNaN(year)) {
      throw new ValidationError('Year must be a valid number');
    }

    const characters = await characterService.getCharactersAliveInYear(year);

    logger?.info('Characters alive in year retrieved', { year, count: characters.length });
    res.status(200).json({
      data: characters,
      year,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/characters/:id
 * Get single character by ID with linked events
 * Public endpoint
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Character ID is required');
    }
    const character = await characterService.getCharacter(id);

    logger?.info('Character retrieved', { character_id: id });
    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/characters
 * Create character (curator/super_user)
 */
router.post('/', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const payload = validateCharacterPayload(req.body);
    const character = await characterService.createCharacter(
      {
        ...payload,
      } as any,
      req.user!,
    );

    logger?.info('Character created', { character_id: character.id });
    res.status(201).json(character);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/characters/:id
 * Update character (curator/super_user)
 */
router.put('/:id', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Character ID is required');
    }

    const updatePayload = validateCharacterPayload(req.body, true);
    const updated = await characterService.updateCharacter(id, updatePayload as any, req.user!);
    logger?.info('Character updated', { character_id: id });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/characters/:id
 * Delete character (super_user)
 */
router.delete('/:id', authenticate, requireRole('super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Character ID is required');
    }

    await characterService.deleteCharacter(id, req.user!);
    logger?.info('Character deleted', { character_id: id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
