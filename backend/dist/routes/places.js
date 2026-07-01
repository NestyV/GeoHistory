"use strict";
/**
 * Places API Routes
 * Fetch and search historical locations
 * See specs/Features.md § 3.4 for endpoint specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const PlaceService_1 = require("@/services/PlaceService");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
const parseCoordinate = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};
const validatePlacePayload = (input, isPartial = false) => {
    const output = {};
    const hasName = input?.current_name !== undefined || input?.name !== undefined;
    if (!isPartial || hasName) {
        const name = typeof input?.current_name === 'string' ? input.current_name : input?.name;
        if (typeof name !== 'string' || !name.trim()) {
            throw new errors_1.ValidationError('Place current_name is required');
        }
        output.current_name = name.trim();
    }
    if (!isPartial || input?.place_type_id !== undefined) {
        if (typeof input?.place_type_id !== 'string' || !input.place_type_id.trim()) {
            throw new errors_1.ValidationError('Place place_type_id is required');
        }
        output.place_type_id = input.place_type_id.trim();
    }
    const hasLatitude = input?.lat !== undefined || input?.latitude !== undefined;
    if (!isPartial || hasLatitude) {
        const latitude = parseCoordinate(input?.lat ?? input?.latitude);
        if (latitude === undefined || latitude < -90 || latitude > 90) {
            throw new errors_1.ValidationError('Place latitude must be between -90 and 90');
        }
        output.lat = latitude;
    }
    const hasLongitude = input?.lng !== undefined || input?.longitude !== undefined;
    if (!isPartial || hasLongitude) {
        const longitude = parseCoordinate(input?.lng ?? input?.longitude);
        if (longitude === undefined || longitude < -180 || longitude > 180) {
            throw new errors_1.ValidationError('Place longitude must be between -180 and 180');
        }
        output.lng = longitude;
    }
    if (input?.previous_name !== undefined) {
        if (typeof input.previous_name !== 'string') {
            throw new errors_1.ValidationError('Place previous_name must be a string');
        }
        output.previous_name = input.previous_name;
    }
    return output;
};
/**
 * GET /api/places
 * List all places with pagination
 * Public endpoint
 */
router.get('/', async (req, res, next) => {
    const logger = req.logger;
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        if (limit < 1 || limit > 100) {
            throw new errors_1.ValidationError('Limit must be between 1 and 100');
        }
        if (offset < 0) {
            throw new errors_1.ValidationError('Offset must be non-negative');
        }
        const { places, total } = await PlaceService_1.placeService.getAllPlaces(limit, offset);
        logger?.info('Places listed', { count: places.length, total });
        res.status(200).json({
            data: places,
            total,
            limit,
            offset,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/places/search/by-name
 * Search places by name
 * Public endpoint
 */
router.get('/search/by-name', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            throw new errors_1.ValidationError('Search query parameter "q" is required');
        }
        const places = await PlaceService_1.placeService.searchPlaces(q);
        logger?.info('Places searched', { search_term: q, count: places.length });
        res.status(200).json({
            data: places,
            search_term: q,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/places/bounds
 * Get places within geographic bounds
 * Query params: minLat, maxLat, minLon, maxLon
 * Public endpoint
 */
router.get('/bounds', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { minLat, maxLat, minLon, maxLon } = req.query;
        const minLatNum = parseFloat(minLat);
        const maxLatNum = parseFloat(maxLat);
        const minLonNum = parseFloat(minLon);
        const maxLonNum = parseFloat(maxLon);
        if (isNaN(minLatNum) || isNaN(maxLatNum) || isNaN(minLonNum) || isNaN(maxLonNum)) {
            throw new errors_1.ValidationError('Bounds parameters must be valid numbers');
        }
        const places = await PlaceService_1.placeService.getPlacesByBounds(minLatNum, maxLatNum, minLonNum, maxLonNum);
        logger?.info('Places within bounds retrieved', { bounds: { minLat: minLatNum, maxLat: maxLatNum, minLon: minLonNum, maxLon: maxLonNum }, count: places.length });
        res.status(200).json({
            data: places,
            bounds: { minLat: minLatNum, maxLat: maxLatNum, minLon: minLonNum, maxLon: maxLonNum },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/places/nearby
 * Get nearby places
 * Query params: lat, lon, distance (km)
 * Public endpoint
 */
router.get('/nearby', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { lat, lon, lng, distance, radius } = req.query;
        const latitude = parseFloat(lat);
        const longitude = parseFloat((lon ?? lng));
        const distanceKm = parseFloat((distance ?? radius));
        if (isNaN(latitude) || isNaN(longitude) || isNaN(distanceKm)) {
            throw new errors_1.ValidationError('Coordinates and distance must be valid numbers');
        }
        const places = await PlaceService_1.placeService.getNearbyPlaces(latitude, longitude, distanceKm);
        logger?.info('Nearby places retrieved', { location: { lat: latitude, lon: longitude }, distance: distanceKm, count: places.length });
        res.status(200).json({
            data: places,
            location: { lat: latitude, lon: longitude },
            distance_km: distanceKm,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/places/:id
 * Get single place by ID
 * Public endpoint
 */
router.get('/:id', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Place ID is required');
        }
        const place = await PlaceService_1.placeService.getPlaceById(id);
        logger?.info('Place retrieved', { place_id: id });
        res.status(200).json(place);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/places
 * Create place (curator/super_user)
 */
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const payload = validatePlacePayload(req.body);
        const created = await PlaceService_1.placeService.createPlace(payload, req.user);
        logger?.info('Place created', { place_id: created.id });
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/places/:id
 * Update place (curator/super_user)
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Place ID is required');
        }
        const payload = validatePlacePayload(req.body, true);
        const updated = await PlaceService_1.placeService.updatePlace(id, payload, req.user);
        logger?.info('Place updated', { place_id: id });
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/places/:id
 * Delete place (super_user)
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)('super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Place ID is required');
        }
        await PlaceService_1.placeService.deletePlace(id, req.user);
        logger?.info('Place deleted', { place_id: id });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=places.js.map