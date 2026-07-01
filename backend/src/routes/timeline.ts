/**
 * Timeline API Routes
 * Historical time periods and events
 * See specs/Features.md § 3.5 for endpoint specifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { timelineService } from '@/services/TimelineService';
import { ValidationError } from '@/utils/errors';

const router = Router();

/**
 * GET /api/timeline
 * Get complete timeline in chronological order
 * Public endpoint
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const frames = await timelineService.getTimeline();

    logger?.info('Timeline retrieved', { frame_count: frames.length });
    res.status(200).json({
      data: frames,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/timeline/:id
 * Get specific historical frame
 * Public endpoint
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Frame ID is required');
    }
    const frame = await timelineService.getFrameById(id);

    logger?.info('Historical frame retrieved', { frame_id: id });
    res.status(200).json(frame);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/timeline/year/:year
 * Get historical frames for a specific year
 * Public endpoint
 */
router.get('/year/:year', async (req: Request, res: Response, next: NextFunction) => {
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

    const frames = await timelineService.getFramesForYear(year);

    logger?.info('Historical frames for year retrieved', { year, frame_count: frames.length });
    res.status(200).json({
      data: frames,
      year,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
