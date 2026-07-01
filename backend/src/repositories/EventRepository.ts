/**
 * Event Repository
 * Database queries for events
 * See specs/Features.md § 4 for event data model
 */

import { BaseRepository } from './BaseRepository';
import { Event } from '@/types';
import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }

  /**
   * Find events by status
   */
  async findByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Event[]> {
    try {
      const result = await query<Event>(
        'SELECT * FROM events WHERE status = $1 ORDER BY created_at DESC',
        [status],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by status', error as Error);
      throw error;
    }
  }

  /**
   * Find events by user
   */
  async findByUserId(userId: string): Promise<Event[]> {
    try {
      const result = await query<Event>(
        'SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC',
        [userId],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by user', error as Error);
      throw error;
    }
  }

  /**
   * Find events within geographic bounds
   */
  async findByBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
  ): Promise<Event[]> {
    try {
      const result = await query<Event>(
        `SELECT * FROM events 
         WHERE latitude BETWEEN $1 AND $2 
         AND longitude BETWEEN $3 AND $4
         AND status = 'approved'
         ORDER BY created_at DESC`,
        [minLat, maxLat, minLon, maxLon],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by bounds', error as Error);
      throw error;
    }
  }

  /**
   * Find events in date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const result = await query<Event>(
        `SELECT * FROM events 
         WHERE start_date >= $1 AND start_date <= $2
         AND status = 'approved'
         ORDER BY start_date ASC`,
        [startDate, endDate],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by date range', error as Error);
      throw error;
    }
  }

  /**
   * Find events between years (inclusive)
   */
  async findByYear(minYear: number, maxYear: number): Promise<Event[]> {
    try {
      const result = await query<Event>(
        `SELECT * FROM events
         WHERE EXTRACT(YEAR FROM event_date) BETWEEN $1 AND $2
         ORDER BY event_date ASC`,
        [minYear, maxYear],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by year range', error as Error);
      throw error;
    }
  }

  /**
   * Update event status
   */
  async updateStatus(eventId: string, status: 'pending' | 'approved' | 'rejected'): Promise<Event | null> {
    try {
      const result = await query<Event>(
        `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, eventId],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error('Error updating event status', error as Error);
      throw error;
    }
  }

  /**
   * Search events by title or description
   */
  async search(searchTerm: string): Promise<Event[]> {
    try {
      const result = await query<Event>(
        `SELECT * FROM events 
         WHERE (title ILIKE $1 OR description ILIKE $1)
         AND status = 'approved'
         ORDER BY created_at DESC`,
        [`%${searchTerm}%`],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error searching events', error as Error);
      throw error;
    }
  }

  /**
   * Find events linked to a character name in events.characters JSONB payload
   */
  async findByCharacterName(characterName: string): Promise<Event[]> {
    try {
      const result = await query<Event>(
        `SELECT *
         FROM events e
         WHERE EXISTS (
           SELECT 1
           FROM jsonb_array_elements(e.characters) elem
           WHERE (
             (jsonb_typeof(elem) = 'string' AND trim(both '"' from elem::text) = $1)
             OR (jsonb_typeof(elem) = 'object' AND elem->>'name' = $1)
           )
         )
         ORDER BY event_date ASC`,
        [characterName],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding events by character name', error as Error);
      throw error;
    }
  }
}

export const eventRepository = new EventRepository();
