/**
 * Place Types API Routes
 * Frontend compatibility endpoints for place type management.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';
import { placeTypeRepository } from '@/repositories/PlaceTypeRepository';
import { ValidationError } from '@/utils/errors';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await placeTypeRepository.findAll({}, 200, 0);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Place type name is required');
    }

    const created = await placeTypeRepository.create({
      name: name.trim(),
      description: description || null,
      icon: icon || null,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Place type ID is required');
    }

    const updated = await placeTypeRepository.update(id, {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon,
      updated_at: new Date(),
    } as any);

    if (!updated) {
      res.status(404).json({ error: 'Not Found', message: 'Place type not found' });
      return;
    }

    res.status(200).json(updated);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

router.delete('/:id', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Place type ID is required');
    }

    const deleted = await placeTypeRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found', message: 'Place type not found' });
      return;
    }

    res.status(204).send();
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export default router;
