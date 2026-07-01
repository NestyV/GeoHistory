"use strict";
/**
 * Character Repository
 * Database queries for historical characters
 * See specs/Features.md § 4 for character data model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterRepository = exports.CharacterRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class CharacterRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('characters');
    }
    /**
     * Search characters by name
     */
    async searchByName(searchTerm) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM characters 
         WHERE name ILIKE $1
         ORDER BY name ASC`, [`%${searchTerm}%`]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error searching characters by name', error);
            throw error;
        }
    }
    /**
     * Find characters by birth year
     */
    async findByBirthYear(year) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM characters 
         WHERE EXTRACT(YEAR FROM birth_date) = $1
         ORDER BY birth_date ASC`, [year]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding characters by birth year', error);
            throw error;
        }
    }
    /**
     * Find alive characters in a given year
     */
    async findAliveInYear(_year) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM characters
         ORDER BY name ASC`);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding alive characters in year', error);
            throw error;
        }
    }
    /**
     * Find characters linked to an event via events.characters JSONB list
     */
    async findByEvent(eventId) {
        try {
            const result = await (0, database_1.query)(`SELECT c.*
         FROM characters c
         JOIN events e ON e.id = $1
         WHERE EXISTS (
           SELECT 1
           FROM jsonb_array_elements(e.characters) elem
           WHERE (
             (jsonb_typeof(elem) = 'string' AND trim(both '"' from elem::text) = c.name)
             OR (jsonb_typeof(elem) = 'object' AND elem->>'name' = c.name)
           )
         )
         ORDER BY c.name ASC`, [eventId]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding characters by event', error);
            throw error;
        }
    }
}
exports.CharacterRepository = CharacterRepository;
exports.characterRepository = new CharacterRepository();
//# sourceMappingURL=CharacterRepository.js.map