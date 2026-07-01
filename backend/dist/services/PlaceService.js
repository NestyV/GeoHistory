"use strict";
/**
 * Place Service
 * Business logic for historical locations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeService = exports.PlaceService = void 0;
const PlaceRepository_1 = require("@/repositories/PlaceRepository");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
const normalizePlaceInput = (data) => {
    return {
        ...data,
        name: data.name || data.current_name,
        latitude: data.latitude ?? data.lat,
        longitude: data.longitude ?? data.lng,
    };
};
class PlaceService {
    /**
     * Get all places with pagination
     */
    async getAllPlaces(limit, offset) {
        try {
            const { rows: places, total } = await PlaceRepository_1.placeRepository.findAll({}, limit, offset);
            return { places, total };
        }
        catch (error) {
            logger_1.defaultLogger.error('Error getting all places', error);
            throw error;
        }
    }
    /**
     * Get place by ID
     */
    async getPlaceById(placeId) {
        try {
            const place = await PlaceRepository_1.placeRepository.findById(placeId);
            if (!place) {
                throw new errors_1.NotFoundError('Place', placeId);
            }
            return place;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.defaultLogger.error('Error getting place by ID', error);
            throw error;
        }
    }
    /**
     * Search places by name
     */
    async searchPlaces(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                throw new errors_1.ValidationError('Search term must be at least 2 characters');
            }
            const places = await PlaceRepository_1.placeRepository.searchByName(searchTerm);
            return places;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error searching places', error);
            throw error;
        }
    }
    /**
     * Get places within geographic bounds
     */
    async getPlacesByBounds(minLat, maxLat, minLon, maxLon) {
        try {
            if (minLat >= maxLat || minLon >= maxLon) {
                throw new errors_1.ValidationError('Invalid bounds coordinates');
            }
            const places = await PlaceRepository_1.placeRepository.findByBounds(minLat, maxLat, minLon, maxLon);
            return places;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error getting places by bounds', error);
            throw error;
        }
    }
    /**
     * Get nearby places
     */
    async getNearbyPlaces(latitude, longitude, distanceKm) {
        try {
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new errors_1.ValidationError('Invalid coordinates');
            }
            if (distanceKm < 1 || distanceKm > 40000) {
                throw new errors_1.ValidationError('Distance must be between 1 and 40000 km');
            }
            const places = await PlaceRepository_1.placeRepository.findNearby(latitude, longitude, distanceKm);
            return places;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error getting nearby places', error);
            throw error;
        }
    }
    /**
     * Create place (curator/super_user only)
     */
    async createPlace(placeData, actor) {
        try {
            if (actor.role !== 'curator' && actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only curators and super users can create places');
            }
            const normalized = normalizePlaceInput(placeData);
            if (!normalized.name || !String(normalized.name).trim()) {
                throw new errors_1.ValidationError('Place name is required');
            }
            if (typeof normalized.latitude !== 'number' || typeof normalized.longitude !== 'number') {
                throw new errors_1.ValidationError('Place latitude and longitude are required');
            }
            const created = await PlaceRepository_1.placeRepository.create({
                ...normalized,
                name: String(normalized.name).trim(),
                created_at: new Date(),
                updated_at: new Date(),
            });
            return created;
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.ValidationError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error creating place', error);
            throw error;
        }
    }
    /**
     * Update place (curator/super_user only)
     */
    async updatePlace(placeId, data, actor) {
        try {
            if (actor.role !== 'curator' && actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only curators and super users can update places');
            }
            await this.getPlaceById(placeId);
            const normalized = normalizePlaceInput(data);
            const updated = await PlaceRepository_1.placeRepository.update(placeId, {
                ...normalized,
                updated_at: new Date(),
            });
            if (!updated) {
                throw new errors_1.NotFoundError('Place', placeId);
            }
            return updated;
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error updating place', error);
            throw error;
        }
    }
    /**
     * Delete place (super_user only)
     */
    async deletePlace(placeId, actor) {
        try {
            if (actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only super users can delete places');
            }
            await this.getPlaceById(placeId);
            await PlaceRepository_1.placeRepository.delete(placeId);
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error deleting place', error);
            throw error;
        }
    }
}
exports.PlaceService = PlaceService;
exports.placeService = new PlaceService();
//# sourceMappingURL=PlaceService.js.map