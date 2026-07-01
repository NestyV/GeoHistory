/**
 * Place Service
 * Business logic for historical locations
 */

import { Place } from '@/types';
import { placeRepository } from '@/repositories/PlaceRepository';
import { AuthorizationError, NotFoundError, ValidationError } from '@/utils/errors';
import { defaultLogger } from '@/utils/logger';

type Actor = {
  id: string;
  role: string;
};

type PlaceInput = Partial<Place> & {
  current_name?: string;
  lat?: number;
  lng?: number;
};

const normalizePlaceInput = (data: PlaceInput): Partial<Place> => {
  return {
    ...data,
    name: data.name || data.current_name,
    latitude: data.latitude ?? data.lat,
    longitude: data.longitude ?? data.lng,
  } as Partial<Place>;
};

export class PlaceService {
  /**
   * Get all places with pagination
   */
  async getAllPlaces(limit?: number, offset?: number): Promise<{ places: Place[]; total: number }> {
    try {
      const { rows: places, total } = await placeRepository.findAll(
        {},
        limit,
        offset,
      );
      return { places, total };
    } catch (error) {
      defaultLogger.error('Error getting all places', error as Error);
      throw error;
    }
  }

  /**
   * Get place by ID
   */
  async getPlaceById(placeId: string): Promise<Place> {
    try {
      const place = await placeRepository.findById(placeId);
      if (!place) {
        throw new NotFoundError('Place', placeId);
      }
      return place;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      defaultLogger.error('Error getting place by ID', error as Error);
      throw error;
    }
  }

  /**
   * Search places by name
   */
  async searchPlaces(searchTerm: string): Promise<Place[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ValidationError('Search term must be at least 2 characters');
      }
      const places = await placeRepository.searchByName(searchTerm);
      return places;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error searching places', error as Error);
      throw error;
    }
  }

  /**
   * Get places within geographic bounds
   */
  async getPlacesByBounds(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number,
  ): Promise<Place[]> {
    try {
      if (minLat >= maxLat || minLon >= maxLon) {
        throw new ValidationError('Invalid bounds coordinates');
      }
      const places = await placeRepository.findByBounds(minLat, maxLat, minLon, maxLon);
      return places;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error getting places by bounds', error as Error);
      throw error;
    }
  }

  /**
   * Get nearby places
   */
  async getNearbyPlaces(latitude: number, longitude: number, distanceKm: number): Promise<Place[]> {
    try {
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ValidationError('Invalid coordinates');
      }
      if (distanceKm < 1 || distanceKm > 40000) {
        throw new ValidationError('Distance must be between 1 and 40000 km');
      }
      const places = await placeRepository.findNearby(latitude, longitude, distanceKm);
      return places;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error getting nearby places', error as Error);
      throw error;
    }
  }

  /**
   * Create place (curator/super_user only)
   */
  async createPlace(placeData: PlaceInput, actor: Actor): Promise<Place> {
    try {
      if (actor.role !== 'curator' && actor.role !== 'super_user') {
        throw new AuthorizationError('Only curators and super users can create places');
      }

      const normalized = normalizePlaceInput(placeData);
      if (!normalized.name || !String(normalized.name).trim()) {
        throw new ValidationError('Place name is required');
      }
      if (typeof normalized.latitude !== 'number' || typeof normalized.longitude !== 'number') {
        throw new ValidationError('Place latitude and longitude are required');
      }

      const created = await placeRepository.create({
        ...normalized,
        name: String(normalized.name).trim(),
        created_at: new Date(),
        updated_at: new Date(),
      } as Partial<Place>);

      return created;
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof ValidationError) {
        throw error;
      }
      defaultLogger.error('Error creating place', error as Error);
      throw error;
    }
  }

  /**
   * Update place (curator/super_user only)
   */
  async updatePlace(placeId: string, data: PlaceInput, actor: Actor): Promise<Place> {
    try {
      if (actor.role !== 'curator' && actor.role !== 'super_user') {
        throw new AuthorizationError('Only curators and super users can update places');
      }

      await this.getPlaceById(placeId);
      const normalized = normalizePlaceInput(data);

      const updated = await placeRepository.update(placeId, {
        ...normalized,
        updated_at: new Date(),
      } as Partial<Place>);

      if (!updated) {
        throw new NotFoundError('Place', placeId);
      }

      return updated;
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error;
      }
      defaultLogger.error('Error updating place', error as Error);
      throw error;
    }
  }

  /**
   * Delete place (super_user only)
   */
  async deletePlace(placeId: string, actor: Actor): Promise<void> {
    try {
      if (actor.role !== 'super_user') {
        throw new AuthorizationError('Only super users can delete places');
      }

      await this.getPlaceById(placeId);
      await placeRepository.delete(placeId);
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error;
      }
      defaultLogger.error('Error deleting place', error as Error);
      throw error;
    }
  }
}

export const placeService = new PlaceService();
