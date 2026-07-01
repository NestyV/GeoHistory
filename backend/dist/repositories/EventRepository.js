"use strict";
/**
 * Event Repository
 * Database queries for events
 * See specs/Features.md § 4 for event data model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRepository = exports.EventRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class EventRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('events');
    }
    /**
     * Find events by status
     */
    async findByStatus(status) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM events WHERE status = $1 ORDER BY created_at DESC', [status]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by status', error);
            throw error;
        }
    }
    /**
     * Find events by user
     */
    async findByUserId(userId) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by user', error);
            throw error;
        }
    }
    /**
     * Find events within geographic bounds
     */
    async findByBounds(minLat, maxLat, minLon, maxLon) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM events 
         WHERE latitude BETWEEN $1 AND $2 
         AND longitude BETWEEN $3 AND $4
         AND status = 'approved'
         ORDER BY created_at DESC`, [minLat, maxLat, minLon, maxLon]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by bounds', error);
            throw error;
        }
    }
    /**
     * Find events in date range
     */
    async findByDateRange(startDate, endDate) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM events 
         WHERE start_date >= $1 AND start_date <= $2
         AND status = 'approved'
         ORDER BY start_date ASC`, [startDate, endDate]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by date range', error);
            throw error;
        }
    }
    /**
     * Find events between years (inclusive)
     */
    async findByYear(minYear, maxYear) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM events
         WHERE EXTRACT(YEAR FROM event_date) BETWEEN $1 AND $2
         ORDER BY event_date ASC`, [minYear, maxYear]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by year range', error);
            throw error;
        }
    }
    /**
     * Update event status
     */
    async updateStatus(eventId, status) {
        try {
            const result = await (0, database_1.query)(`UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, eventId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error updating event status', error);
            throw error;
        }
    }
    /**
     * Search events by title or description
     */
    async search(searchTerm) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM events 
         WHERE (title ILIKE $1 OR description ILIKE $1)
         AND status = 'approved'
         ORDER BY created_at DESC`, [`%${searchTerm}%`]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error searching events', error);
            throw error;
        }
    }
    /**
     * Find events linked to a character name in events.characters JSONB payload
     */
    async findByCharacterName(characterName) {
        try {
            const result = await (0, database_1.query)(`SELECT *
         FROM events e
         WHERE EXISTS (
           SELECT 1
           FROM jsonb_array_elements(e.characters) elem
           WHERE (
             (jsonb_typeof(elem) = 'string' AND trim(both '"' from elem::text) = $1)
             OR (jsonb_typeof(elem) = 'object' AND elem->>'name' = $1)
           )
         )
         ORDER BY event_date ASC`, [characterName]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding events by character name', error);
            throw error;
        }
    }
}
exports.EventRepository = EventRepository;
exports.eventRepository = new EventRepository();
//# sourceMappingURL=EventRepository.js.map