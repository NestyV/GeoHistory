/**
 * User API Routes
 * Compatibility endpoints for frontend user preferences.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/auth';
import { query } from '@/utils/database';
import { ValidationError } from '@/utils/errors';

const router = Router();

/**
 * GET /api/user/preferences
 * Get current authenticated user's map preferences.
 */
router.get('/preferences', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{
      last_frame_id: string | null;
      last_year: number | null;
      last_lat: number | null;
      last_lng: number | null;
      last_zoom: number | null;
    }>(
      `
        SELECT last_frame_id, last_year, last_lat, last_lng, last_zoom
        FROM user_preferences
        WHERE user_id = $1
        LIMIT 1
      `,
      [req.user!.id],
    );

    if (result.rows.length === 0) {
      res.status(200).json({ hasPreferences: false });
      return;
    }

    res.status(200).json({
      hasPreferences: true,
      preferences: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/user/preferences
 * Create or update current authenticated user's map preferences.
 */
router.post('/preferences', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      last_frame_id = null,
      last_year = null,
      last_lat = null,
      last_lng = null,
      last_zoom = null,
    } = req.body ?? {};

    if (last_year !== null && !Number.isInteger(last_year)) {
      throw new ValidationError('last_year must be an integer or null');
    }
    if (last_zoom !== null && !Number.isInteger(last_zoom)) {
      throw new ValidationError('last_zoom must be an integer or null');
    }

    const asNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      return null;
    };

    const safeLat = asNumberOrNull(last_lat);
    const safeLng = asNumberOrNull(last_lng);

    await query(
      `
        INSERT INTO user_preferences (
          user_id,
          last_frame_id,
          last_year,
          last_lat,
          last_lng,
          last_zoom,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          last_frame_id = EXCLUDED.last_frame_id,
          last_year = EXCLUDED.last_year,
          last_lat = EXCLUDED.last_lat,
          last_lng = EXCLUDED.last_lng,
          last_zoom = EXCLUDED.last_zoom,
          updated_at = NOW()
      `,
      [req.user!.id, last_frame_id, last_year, safeLat, safeLng, last_zoom],
    );

    res.status(200).json({
      success: true,
      message: 'Preferences saved',
    });
  } catch (error) {
    next(error);
  }
});

export default router;