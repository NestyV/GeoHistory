/**
 * Service layer for Event business logic
 * Handles event operations with permission checking
 * See specs/Constitution.md § 5.3 for service pattern
 */
import { CreateEventRequest, UpdateEventRequest, Event, User } from '@/types';
export declare class EventService {
    /**
     * Get all approved events with pagination
     */
    getAllApprovedEvents(limit?: number, offset?: number): Promise<{
        events: Event[];
        total: number;
    }>;
    /**
     * Get event by ID
     */
    getEventById(eventId: string): Promise<Event>;
    /**
     * Create new event
     */
    createEvent(data: CreateEventRequest, userId: string): Promise<Event>;
    /**
     * Update event
     */
    updateEvent(eventId: string, data: UpdateEventRequest, user: Omit<User, 'password_hash'>): Promise<Event>;
    /**
     * Approve event (curator/super_user only)
     */
    approveEvent(eventId: string, user: Omit<User, 'password_hash'>): Promise<Event>;
    /**
     * Reject event (curator/super_user only)
     */
    rejectEvent(eventId: string, user: Omit<User, 'password_hash'>, reason?: string): Promise<Event>;
    /**
     * Delete event
     */
    deleteEvent(eventId: string, user: Omit<User, 'password_hash'>): Promise<void>;
}
export declare const eventService: EventService;
//# sourceMappingURL=EventService.d.ts.map