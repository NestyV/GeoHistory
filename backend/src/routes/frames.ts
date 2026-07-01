/**
 * Frames API Routes
 * Compatibility routes for historical frames used by frontend pages.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';
import { query } from '@/utils/database';
import { ValidationError } from '@/utils/errors';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, name, description, start_date, end_date, created_at
       FROM frames
       ORDER BY start_date ASC NULLS LAST, name ASC`,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    if (!name || typeof name !== 'string') {
      throw new ValidationError('Frame name is required');
    }

    const result = await query(
      `INSERT INTO frames (name, description, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, description, start_date, end_date, created_at`,
      [name.trim(), description || null, start_date || null, end_date || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date } = req.body;
    if (!id) {
      throw new ValidationError('Frame ID is required');
    }

    const result = await query(
      `UPDATE frames
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date)
       WHERE id = $5
       RETURNING id, name, description, start_date, end_date, created_at`,
      [name || null, description || null, start_date || null, end_date || null, id],
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Not Found', message: 'Frame not found' });
      return;
    }

    res.status(200).json(result.rows[0]);
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
      throw new ValidationError('Frame ID is required');
    }

    const result = await query('DELETE FROM frames WHERE id = $1', [id]);
    if (!result.rowCount) {
      res.status(404).json({ error: 'Not Found', message: 'Frame not found' });
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
