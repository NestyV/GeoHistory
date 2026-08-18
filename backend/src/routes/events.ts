/**
 * Events API Routes
 * Full CRUD operations for historical events
 * See specs/Features.md § 3.2 for endpoint specifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@/middleware/auth';
import { eventService } from '@/services/EventService';
import { eventRepository } from '@/repositories/EventRepository';
import { ValidationError } from '@/utils/errors';
import { CreateEventRequest, UpdateEventRequest } from '@/types';

const router = Router();

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeEventPayload = (input: any): CreateEventRequest => {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';
  const startDate = typeof input?.start_date === 'string'
    ? input.start_date
    : (typeof input?.event_date === 'string' ? input.event_date : '');
  const latitude = toFiniteNumber(input?.latitude ?? input?.lat);
  const longitude = toFiniteNumber(input?.longitude ?? input?.lng);

  if (!title) {
    throw new ValidationError('Event title is required');
  }
  if (!startDate) {
    throw new ValidationError('Event start date is required');
  }
  if (latitude === undefined || latitude < -90 || latitude > 90) {
    throw new ValidationError('Event latitude must be between -90 and 90');
  }
  if (longitude === undefined || longitude < -180 || longitude > 180) {
    throw new ValidationError('Event longitude must be between -180 and 180');
  }

  return {
    title,
    description: typeof input?.description === 'string' ? input.description : '',
    frame_id: typeof input?.frame_id === 'string' && input.frame_id.trim().length > 0 ? input.frame_id : null,
    characters: Array.isArray(input?.characters) ? input.characters : [],
    event_date: startDate,
    start_date: startDate,
    end_date: typeof input?.end_date === 'string' ? input.end_date : undefined,
    location: typeof input?.location === 'string' ? input.location : '',
    lat: latitude,
    lng: longitude,
    latitude,
    longitude,
  };
};

const normalizeEventUpdatePayload = (input: any): UpdateEventRequest => {
  const output: UpdateEventRequest = {};

  if (input?.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      throw new ValidationError('Event title must be a non-empty string');
    }
    output.title = input.title.trim();
  }

  if (input?.description !== undefined) {
    if (typeof input.description !== 'string') {
      throw new ValidationError('Event description must be a string');
    }
    output.description = input.description;
  }

  if (input?.start_date !== undefined || input?.event_date !== undefined) {
    const startDate = typeof input.start_date === 'string'
      ? input.start_date
      : (typeof input.event_date === 'string' ? input.event_date : '');
    if (!startDate) {
      throw new ValidationError('Event start date must be a valid string');
    }
    output.start_date = startDate;
    output.event_date = startDate;
  }

  if (input?.frame_id !== undefined) {
    if (input.frame_id !== null && typeof input.frame_id !== 'string') {
      throw new ValidationError('Event frame_id must be a string or null');
    }
    output.frame_id = input.frame_id;
  }

  if (input?.characters !== undefined) {
    if (!Array.isArray(input.characters)) {
      throw new ValidationError('Event characters must be an array');
    }
    output.characters = input.characters;
  }

  if (input?.latitude !== undefined || input?.lat !== undefined) {
    const latitude = toFiniteNumber(input.latitude ?? input.lat);
    if (latitude === undefined || latitude < -90 || latitude > 90) {
      throw new ValidationError('Event latitude must be between -90 and 90');
    }
    output.latitude = latitude;
  }

  if (input?.longitude !== undefined || input?.lng !== undefined) {
    const longitude = toFiniteNumber(input.longitude ?? input.lng);
    if (longitude === undefined || longitude < -180 || longitude > 180) {
      throw new ValidationError('Event longitude must be between -180 and 180');
    }
    output.longitude = longitude;
    output.lng = longitude;
  }

  if (input?.location !== undefined) {
    if (typeof input.location !== 'string') {
      throw new ValidationError('Event location must be a string');
    }
    output.location = input.location;
  }

  if (input?.end_date !== undefined) {
    if (typeof input.end_date !== 'string') {
      throw new ValidationError('Event end date must be a valid string');
    }
    output.end_date = input.end_date;
  }

  return output;
};

/**
 * GET /api/events
 * List all approved events with pagination
 * Public endpoint
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    const { events, total } = await eventService.getAllApprovedEvents(limit, offset);

    logger?.info('Events listed', { count: events.length, total });
    res.status(200).json({
      data: events,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/my
 * List events created by current authenticated user
 */
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const events = await eventRepository.findByUserId(req.user!.id);
    logger?.info('My events listed', { count: events.length, user_id: req.user!.id });
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID
 * Public endpoint (only approved events visible to non-owners)
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }

    const event = await eventService.getEventById(id);

    // Only show non-approved events to owner or super_user
    if (event.status !== 'approved' && event.user_id !== req.user?.id && req.user?.role !== 'super_user') {
      throw new ValidationError('Event not found');
    }

    logger?.info('Event retrieved', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events
 * Create new event
 * Requires authentication
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const data = normalizeEventPayload(req.body);

    const event = await eventService.createEvent(data, req.user!.id);

    logger?.info('Event created', { event_id: event.id });
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/events/:id
 * Update event
 * Requires authentication - owner or super_user
 */
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }
    const data = normalizeEventUpdatePayload(req.body);

    const event = await eventService.updateEvent(id, data, req.user!);

    logger?.info('Event updated', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/events/:id
 * Delete event
 * Requires authentication - owner or super_user
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }

    await eventService.deleteEvent(id, req.user!);

    logger?.info('Event deleted', { event_id: id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:id/approve
 * Approve pending event
 * Requires curator role
 */
router.post('/:id/approve', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }

    const event = await eventService.approveEvent(id, req.user!);

    logger?.info('Event approved', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/approve', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }

    const event = await eventService.approveEvent(id, req.user!);

    logger?.info('Event approved', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/events/:id/reject
 * Reject pending event
 * Requires curator role
 */
router.post('/:id/reject', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }
    const { reason } = req.body;
    if (reason !== undefined && typeof reason !== 'string') {
      throw new ValidationError('Reject reason must be a string');
    }

    const event = await eventService.rejectEvent(id, req.user!, reason);

    logger?.info('Event rejected', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/reject', authenticate, requireRole('curator', 'super_user'), async (req: Request, res: Response, next: NextFunction) => {
  const logger = req.logger;
  try {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError('Event ID is required');
    }
    const { reason } = req.body;
    if (reason !== undefined && typeof reason !== 'string') {
      throw new ValidationError('Reject reason must be a string');
    }

    const event = await eventService.rejectEvent(id, req.user!, reason);

    logger?.info('Event rejected', { event_id: id });
    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

export default router;
