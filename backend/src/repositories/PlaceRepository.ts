/**
 * Place Repository
 * Database queries for historical locations
 * See specs/Features.md § 4 for place data model
 */

import { BaseRepository } from './BaseRepository';
import { Place } from '@/types';
import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class PlaceRepository extends BaseRepository<Place> {
  constructor() {
    super('places');
  }

  async findAll(
    _filters?: Record<string, any>,
    limit = 20,
    offset = 0,
  ): Promise<{ rows: Place[]; total: number }> {
    try {
      const countResult = await query<{ total: number }>('SELECT COUNT(*)::int AS total FROM places');
      const result = await query<Place>(
        `SELECT
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
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      return { rows: result.rows, total: Number(countResult.rows[0]?.total ?? 0) };
    } catch (error) {
      defaultLogger.error('Error finding all places', error as Error);
      throw error;
    }
  }

  async findById(id: string): Promise<Place | null> {
    try {
      const result = await query<Place>(
        `SELECT
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at
         FROM places
         WHERE id = $1`,
        [id],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error('Error finding place by ID', error as Error);
      throw error;
    }
  }

  async create(data: Partial<Place>): Promise<Place> {
    try {
      const result = await query<Place>(
        `INSERT INTO places (current_name, previous_name, lat, lng, place_type_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING
           id,
           current_name AS name,
           previous_name AS description,
           lat AS latitude,
           lng AS longitude,
           place_type_id,
           created_at,
           updated_at`,
        [
          data.name,
          data.description || null,
          data.latitude,
          data.longitude,
          data.place_type_id,
        ],
      );
      const created = result.rows[0];
      if (!created) {
        throw new Error('Failed to create place');
      }
      return created;
    } catch (error) {
      defaultLogger.error('Error creating place', error as Error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Place>): Promise<Place | null> {
    try {
      const result = await query<Place>(
        `UPDATE places
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
           updated_at`,
        [
          data.name ?? null,
          data.description ?? null,
          data.latitude ?? null,
          data.longitude ?? null,
          data.place_type_id ?? null,
          id,
        ],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error('Error updating place', error as Error);
      throw error;
    }
  }

  /**
   * Find places by type
   */
  async findByPlaceType(placeTypeId: string): Promise<Place[]> {
    try {
      const result = await query<Place>(
        `SELECT
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
         ORDER BY current_name ASC`,
        [placeTypeId],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding places by type', error as Error);
      throw error;
    }
  }

  /**
   * Search places by name
   */
  async searchByName(searchTerm: string): Promise<Place[]> {
    try {
      const result = await query<Place>(
        `SELECT
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
         ORDER BY current_name ASC`,
        [`%${searchTerm}%`],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error searching places by name', error as Error);
      throw error;
    }
  }

  /**
   * Find places within geographic bounds
   */
  async findByBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
  ): Promise<Place[]> {
    try {
      const result = await query<Place>(
        `SELECT
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
         ORDER BY current_name ASC`,
        [minLat, maxLat, minLon, maxLon],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding places by bounds', error as Error);
      throw error;
    }
  }

  /**
   * Get nearby places (within distance)
   */
  async findNearby(latitude: number, longitude: number, distanceKm: number): Promise<Place[]> {
    try {
      const result = await query<Place>(
        `SELECT
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
         ORDER BY current_name ASC`,
        [latitude, longitude, distanceKm],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding nearby places', error as Error);
      throw error;
    }
  }
}

export const placeRepository = new PlaceRepository();
