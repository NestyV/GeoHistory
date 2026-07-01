/**
 * Event Repository
 * Database queries for events
 * See specs/Features.md § 4 for event data model
 */
import { BaseRepository } from './BaseRepository';
import { Event } from '@/types';
export declare class EventRepository extends BaseRepository<Event> {
    constructor();
    /**
     * Find events by status
     */
    findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Event[]>;
    /**
     * Find events by user
     */
    findByUserId(userId: string): Promise<Event[]>;
    /**
     * Find events within geographic bounds
     */
    findByBounds(minLat: number, maxLat: number, minLon: number, maxLon: number): Promise<Event[]>;
    /**
     * Find events in date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
    /**
     * Find events between years (inclusive)
     */
    findByYear(minYear: number, maxYear: number): Promise<Event[]>;
    /**
     * Update event status
     */
    updateStatus(eventId: string, status: 'pending' | 'approved' | 'rejected'): Promise<Event | null>;
    /**
     * Search events by title or description
     */
    search(searchTerm: string): Promise<Event[]>;
    /**
     * Find events linked to a character name in events.characters JSONB payload
     */
    findByCharacterName(characterName: string): Promise<Event[]>;
}
export declare const eventRepository: EventRepository;
//# sourceMappingURL=EventRepository.d.ts.map