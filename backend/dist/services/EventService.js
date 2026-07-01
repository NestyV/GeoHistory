"use strict";
/**
 * Service layer for Event business logic
 * Handles event operations with permission checking
 * See specs/Constitution.md § 5.3 for service pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = exports.EventService = void 0;
const EventRepository_1 = require("@/repositories/EventRepository");
const PermissionService_1 = require("./PermissionService");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class EventService {
    /**
     * Get all approved events with pagination
     */
    async getAllApprovedEvents(limit, offset) {
        try {
            const { rows: events, total } = await EventRepository_1.eventRepository.findAll({ status: 'approved' }, limit, offset);
            return { events, total };
        }
        catch (error) {
            logger_1.defaultLogger.error('Error getting approved events', error);
            throw error;
        }
    }
    /**
     * Get event by ID
     */
    async getEventById(eventId) {
        try {
            const event = await EventRepository_1.eventRepository.findById(eventId);
            if (!event) {
                throw new errors_1.NotFoundError('Event', eventId);
            }
            return event;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.defaultLogger.error('Error getting event by ID', error);
            throw error;
        }
    }
    /**
     * Create new event
     */
    async createEvent(data, userId) {
        try {
            // Validate input
            if (!data.title || !data.title.trim()) {
                throw new errors_1.ValidationError('Event title is required');
            }
            if (!data.start_date) {
                throw new errors_1.ValidationError('Event start date is required');
            }
            const event = await EventRepository_1.eventRepository.create({
                user_id: userId,
                title: data.title.trim(),
                description: data.description || '',
                start_date: new Date(data.start_date),
                end_date: data.end_date ? new Date(data.end_date) : undefined,
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date(),
            });
            logger_1.defaultLogger.info('Event created', { event_id: event.id, user_id: userId });
            return event;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error creating event', error);
            throw error;
        }
    }
    /**
     * Update event
     */
    async updateEvent(eventId, data, user) {
        try {
            const event = await this.getEventById(eventId);
            // Check permissions
            const canUpdate = await PermissionService_1.PermissionService.canUpdateEvent(event, user);
            if (!canUpdate) {
                throw new errors_1.AuthorizationError('You do not have permission to update this event');
            }
            const updated = await EventRepository_1.eventRepository.update(eventId, {
                title: data.title?.trim(),
                description: data.description?.trim(),
                start_date: data.start_date ? new Date(data.start_date) : undefined,
                end_date: data.end_date ? new Date(data.end_date) : undefined,
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                updated_at: new Date(),
            });
            if (!updated) {
                throw new errors_1.NotFoundError('Event', eventId);
            }
            logger_1.defaultLogger.info('Event updated', { event_id: eventId, user_id: user.id });
            return updated;
        }
        catch (error) {
            if (error instanceof (errors_1.ValidationError || errors_1.AuthorizationError || errors_1.NotFoundError))
                throw error;
            logger_1.defaultLogger.error('Error updating event', error);
            throw error;
        }
    }
    /**
     * Approve event (curator/super_user only)
     */
    async approveEvent(eventId, user) {
        try {
            // Check permissions
            if (!PermissionService_1.PermissionService.canApproveEvent(user)) {
                throw new errors_1.AuthorizationError('Only curators can approve events');
            }
            const event = await this.getEventById(eventId);
            if (event.status !== 'pending') {
                throw new errors_1.ValidationError('Only pending events can be approved');
            }
            const approved = await EventRepository_1.eventRepository.updateStatus(eventId, 'approved');
            if (!approved) {
                throw new errors_1.NotFoundError('Event', eventId);
            }
            logger_1.defaultLogger.info('Event approved', { event_id: eventId, curator_id: user.id });
            return approved;
        }
        catch (error) {
            if (error instanceof (errors_1.ValidationError || errors_1.AuthorizationError || errors_1.NotFoundError))
                throw error;
            logger_1.defaultLogger.error('Error approving event', error);
            throw error;
        }
    }
    /**
     * Reject event (curator/super_user only)
     */
    async rejectEvent(eventId, user, reason) {
        try {
            // Check permissions
            if (!PermissionService_1.PermissionService.canRejectEvent(user)) {
                throw new errors_1.AuthorizationError('Only curators can reject events');
            }
            const event = await this.getEventById(eventId);
            if (event.status !== 'pending') {
                throw new errors_1.ValidationError('Only pending events can be rejected');
            }
            const rejected = await EventRepository_1.eventRepository.updateStatus(eventId, 'rejected');
            if (!rejected) {
                throw new errors_1.NotFoundError('Event', eventId);
            }
            logger_1.defaultLogger.info('Event rejected', { event_id: eventId, curator_id: user.id, reason });
            return rejected;
        }
        catch (error) {
            if (error instanceof (errors_1.ValidationError || errors_1.AuthorizationError || errors_1.NotFoundError))
                throw error;
            logger_1.defaultLogger.error('Error rejecting event', error);
            throw error;
        }
    }
    /**
     * Delete event
     */
    async deleteEvent(eventId, user) {
        try {
            const event = await this.getEventById(eventId);
            // Check permissions
            const canDelete = await PermissionService_1.PermissionService.canDeleteEvent(event, user);
            if (!canDelete) {
                throw new errors_1.AuthorizationError('You do not have permission to delete this event');
            }
            await EventRepository_1.eventRepository.delete(eventId);
            logger_1.defaultLogger.info('Event deleted', { event_id: eventId, user_id: user.id });
        }
        catch (error) {
            if (error instanceof (errors_1.AuthorizationError || errors_1.NotFoundError))
                throw error;
            logger_1.defaultLogger.error('Error deleting event', error);
            throw error;
        }
    }
}
exports.EventService = EventService;
exports.eventService = new EventService();
//# sourceMappingURL=EventService.js.map