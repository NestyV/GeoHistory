/**
 * Admin API Routes
 * Administrative operations - super_user only
 * See specs/Features.md § 3.6 for endpoint specifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';
import { adminService } from '@/services/AdminService';
import { eventRepository } from '@/repositories/EventRepository';
import { ValidationError } from '@/utils/errors';

const router = Router();

/**
 * GET /api/admin/events/pending
 * List pending events (curator/super_user)
 */
router.get('/events/pending', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const events = await eventRepository.findByStatus('pending');
    logger?.info('Pending events retrieved', { count: events.length });
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * List all users (super_user only)
 * Requires authentication and super_user role
 */
router.get('/users', authenticate, requireRole('super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    const { users, total } = await adminService.getAllUsers(limit, offset);

    logger?.info('Users list retrieved', { count: users.length, total });
    res.status(200).json({
      data: users,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role (super_user only)
 * Requires authentication and super_user role
 */
router.put('/users/:id/role', authenticate, requireRole('super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!id) {
      throw new ValidationError('User ID is required');
    }

    if (!role) {
      throw new ValidationError('Role is required');
    }

    const user = await adminService.updateUserRole(id, role, req.user!);

    logger?.info('User role updated', { user_id: id, new_role: role });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
