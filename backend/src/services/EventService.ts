/**
 * Service layer for Event business logic
 * Handles event operations with permission checking
 * See specs/Constitution.md § 5.3 for service pattern
 */

import { CreateEventRequest, UpdateEventRequest, Event, User } from '@/types';
import { eventRepository } from '@/repositories/EventRepository';
import { PermissionService } from './PermissionService';
import { ValidationError, NotFoundError, AuthorizationError } from '@/utils/errors';
import { defaultLogger } from '@/utils/logger';

export class EventService {
  /**
   * Get all approved events with pagination
   */
  async getAllApprovedEvents(limit?: number, offset?: number): Promise<{ events: Event[]; total: number }> {
    try {
      const { rows: events, total } = await eventRepository.findAll(
        { status: 'approved' },
        limit,
        offset,
      );
      return { events, total };
    } catch (error) {
      defaultLogger.error('Error getting approved events', error as Error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<Event> {
    try {
      const event = await eventRepository.findById(eventId);
      if (!event) {
        throw new NotFoundError('Event', eventId);
      }
      return event;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      defaultLogger.error('Error getting event by ID', error as Error);
      throw error;
    }
  }

  /**
   * Create new event
   */
  async createEvent(
    data: CreateEventRequest,
    userId: string,
  ): Promise<Event> {
    try {
      const eventDate = data.event_date || data.start_date;
      const latitude = data.lat ?? data.latitude;
      const longitude = data.lng ?? data.longitude;

      // Validate input
      if (!data.title || !data.title.trim()) {
        throw new ValidationError('Event title is required');
      }
      if (!eventDate) {
        throw new ValidationError('Event start date is required');
      }
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new ValidationError('Event coordinates are required');
      }

      const event = await eventRepository.create({
        user_id: userId,
        frame_id: data.frame_id ?? null,
        title: data.title.trim(),
        description: data.description || '',
        event_date: new Date(eventDate),
        lat: latitude,
        lng: longitude,
        characters: JSON.stringify(Array.isArray(data.characters) ? data.characters : []),
        status: 'pending',
        created_at: new Date(),
      } as any);

      defaultLogger.info('Event created', { event_id: event.id, user_id: userId });
      return event;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error creating event', error as Error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(
    eventId: string,
    data: UpdateEventRequest,
    user: Omit<User, 'password_hash'>,
  ): Promise<Event> {
    try {
      const event = await this.getEventById(eventId);

      // Check permissions
      const canUpdate = await PermissionService.canUpdateEvent(event, user);
      if (!canUpdate) {
        throw new AuthorizationError('You do not have permission to update this event');
      }

      const updated = await eventRepository.update(eventId, {
        title: data.title?.trim(),
        description: data.description?.trim(),
        event_date: (data.event_date || data.start_date)
          ? new Date(data.event_date || (data.start_date as string))
          : undefined,
        frame_id: data.frame_id,
        characters: data.characters !== undefined
          ? JSON.stringify(Array.isArray(data.characters) ? data.characters : [])
          : undefined,
        lat: data.lat ?? data.latitude,
        lng: data.lng ?? data.longitude,
      } as any);

      if (!updated) {
        throw new NotFoundError('Event', eventId);
      }

      defaultLogger.info('Event updated', { event_id: eventId, user_id: user.id });
      return updated;
    } catch (error) {
      if (error instanceof (ValidationError || AuthorizationError || NotFoundError)) throw error;
      defaultLogger.error('Error updating event', error as Error);
      throw error;
    }
  }

  /**
   * Approve event (curator/super_user only)
   */
  async approveEvent(eventId: string, user: Omit<User, 'password_hash'>): Promise<Event> {
    try {
      // Check permissions
      if (!PermissionService.canApproveEvent(user)) {
        throw new AuthorizationError('Only curators can approve events');
      }

      const event = await this.getEventById(eventId);
      if (event.status !== 'pending') {
        throw new ValidationError('Only pending events can be approved');
      }

      const approved = await eventRepository.updateStatus(eventId, 'approved');
      if (!approved) {
        throw new NotFoundError('Event', eventId);
      }

      defaultLogger.info('Event approved', { event_id: eventId, curator_id: user.id });
      return approved;
    } catch (error) {
      if (error instanceof (ValidationError || AuthorizationError || NotFoundError)) throw error;
      defaultLogger.error('Error approving event', error as Error);
      throw error;
    }
  }

  /**
   * Reject event (curator/super_user only)
   */
  async rejectEvent(eventId: string, user: Omit<User, 'password_hash'>, reason?: string): Promise<Event> {
    try {
      // Check permissions
      if (!PermissionService.canRejectEvent(user)) {
        throw new AuthorizationError('Only curators can reject events');
      }

      const event = await this.getEventById(eventId);
      if (event.status !== 'pending') {
        throw new ValidationError('Only pending events can be rejected');
      }

      const rejected = await eventRepository.updateStatus(eventId, 'rejected');
      if (!rejected) {
        throw new NotFoundError('Event', eventId);
      }

      defaultLogger.info('Event rejected', { event_id: eventId, curator_id: user.id, reason });
      return rejected;
    } catch (error) {
      if (error instanceof (ValidationError || AuthorizationError || NotFoundError)) throw error;
      defaultLogger.error('Error rejecting event', error as Error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, user: Omit<User, 'password_hash'>): Promise<void> {
    try {
      const event = await this.getEventById(eventId);

      // Check permissions
      const canDelete = await PermissionService.canDeleteEvent(event, user);
      if (!canDelete) {
        throw new AuthorizationError('You do not have permission to delete this event');
      }

      await eventRepository.delete(eventId);
      defaultLogger.info('Event deleted', { event_id: eventId, user_id: user.id });
    } catch (error) {
      if (error instanceof (AuthorizationError || NotFoundError)) throw error;
      defaultLogger.error('Error deleting event', error as Error);
      throw error;
    }
  }
}

export const eventService = new EventService();
