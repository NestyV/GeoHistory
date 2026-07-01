"use strict";
/**
 * Place Repository
 * Database queries for historical locations
 * See specs/Features.md § 4 for place data model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeRepository = exports.PlaceRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class PlaceRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('places');
    }
    async findAll(_filters, limit = 20, offset = 0) {
        try {
            const countResult = await (0, database_1.query)('SELECT COUNT(*)::int AS total FROM places');
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         ORDER BY current_name ASC
         LIMIT $1 OFFSET $2`, [limit, offset]);
            return { rows: result.rows, total: Number(countResult.rows[0]?.total ?? 0) };
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding all places', error);
            throw error;
        }
    }
    async findById(id) {
        try {
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE id = $1`, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding place by ID', error);
            throw error;
        }
    }
    async create(data) {
        try {
            const result = await (0, database_1.query)(`INSERT INTO places (current_name, previous_name, lat, lng, place_type_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at`, [
                data.name,
                data.description || null,
                data.latitude,
                data.longitude,
                data.place_type_id,
            ]);
            const created = result.rows[0];
            if (!created) {
                throw new Error('Failed to create place');
            }
            return created;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error creating place', error);
            throw error;
        }
    }
    async update(id, data) {
        try {
            const result = await (0, database_1.query)(`UPDATE places
         SET
           current_name = COALESCE($1, current_name),
           previous_name = COALESCE($2, previous_name),
           lat = COALESCE($3, lat),
           lng = COALESCE($4, lng),
           place_type_id = COALESCE($5, place_type_id),
           updated_at = NOW()
         WHERE id = $6
         RETURNING
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at`, [
                data.name ?? null,
                data.description ?? null,
                data.latitude ?? null,
                data.longitude ?? null,
                data.place_type_id ?? null,
                id,
            ]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error updating place', error);
            throw error;
        }
    }
    /**
     * Find places by type
     */
    async findByPlaceType(placeTypeId) {
        try {
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE place_type_id = $1
         ORDER BY current_name ASC`, [placeTypeId]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding places by type', error);
            throw error;
        }
    }
    /**
     * Search places by name
     */
    async searchByName(searchTerm) {
        try {
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE current_name ILIKE $1 OR COALESCE(previous_name, '') ILIKE $1
         ORDER BY current_name ASC`, [`%${searchTerm}%`]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error searching places by name', error);
            throw error;
        }
    }
    /**
     * Find places within geographic bounds
     */
    async findByBounds(minLat, maxLat, minLon, maxLon) {
        try {
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE lat BETWEEN $1 AND $2
           AND lng BETWEEN $3 AND $4
         ORDER BY current_name ASC`, [minLat, maxLat, minLon, maxLon]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding places by bounds', error);
            throw error;
        }
    }
    /**
     * Get nearby places (within distance)
     */
    async findNearby(latitude, longitude, distanceKm) {
        try {
            const result = await (0, database_1.query)(`SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE (
           6371 * acos(
             cos(radians($1)) * cos(radians(lat)) *
             cos(radians(lng) - radians($2)) +
             sin(radians($1)) * sin(radians(lat))
           )
         ) <= $3
         ORDER BY current_name ASC`, [latitude, longitude, distanceKm]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding nearby places', error);
            throw error;
        }
    }
}
exports.PlaceRepository = PlaceRepository;
exports.placeRepository = new PlaceRepository();
//# sourceMappingURL=PlaceRepository.js.map