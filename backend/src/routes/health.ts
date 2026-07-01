/**
 * Health check route
 * Used for uptime monitoring and deployment verification
 */

import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const logger = req.logger;

  try {
    logger?.debug('Health check requested');

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    const logger = req.logger;
    logger?.error('Health check failed', error as Error);

    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
