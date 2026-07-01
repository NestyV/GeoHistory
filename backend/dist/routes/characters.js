"use strict";
/**
 * Characters API Routes
 * Fetch and search historical characters
 * See specs/Features.md § 3.3 for endpoint specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const CharacterService_1 = require("@/services/CharacterService");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
const validateCharacterPayload = (input, isPartial = false) => {
    const output = {};
    if (!isPartial || input?.name !== undefined) {
        if (typeof input?.name !== 'string' || !input.name.trim()) {
            throw new errors_1.ValidationError('Character name is required');
        }
        output.name = input.name.trim();
    }
    if (input?.description !== undefined) {
        if (typeof input.description !== 'string') {
            throw new errors_1.ValidationError('Character description must be a string');
        }
        output.description = input.description;
    }
    if (input?.alias !== undefined) {
        if (typeof input.alias !== 'string') {
            throw new errors_1.ValidationError('Character alias must be a string');
        }
        output.alias = input.alias;
    }
    if (input?.image_url !== undefined) {
        if (typeof input.image_url !== 'string') {
            throw new errors_1.ValidationError('Character image_url must be a string');
        }
        output.image_url = input.image_url;
    }
    return output;
};
/**
 * GET /api/characters
 * List all characters with pagination
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
        const { characters, total } = await CharacterService_1.characterService.getAllCharacters(limit, offset);
        logger?.info('Characters listed', { count: characters.length, total });
        res.status(200).json({
            data: characters,
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
 * GET /api/characters/search/by-name
 * Search characters by name
 * Public endpoint
 */
router.get('/search/by-name', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            throw new errors_1.ValidationError('Search query parameter "q" is required');
        }
        const characters = await CharacterService_1.characterService.searchCharacters(q);
        logger?.info('Characters searched', { search_term: q, count: characters.length });
        res.status(200).json({
            data: characters,
            search_term: q,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/characters/alive-in/:year
 * Get characters alive in specific year
 * Public endpoint
 */
router.get('/alive-in/:year', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { year: yearParam } = req.params;
        if (!yearParam) {
            throw new errors_1.ValidationError('Year is required');
        }
        const year = parseInt(yearParam, 10);
        if (isNaN(year)) {
            throw new errors_1.ValidationError('Year must be a valid number');
        }
        const characters = await CharacterService_1.characterService.getCharactersAliveInYear(year);
        logger?.info('Characters alive in year retrieved', { year, count: characters.length });
        res.status(200).json({
            data: characters,
            year,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/characters/:id
 * Get single character by ID with linked events
 * Public endpoint
 */
router.get('/:id', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Character ID is required');
        }
        const character = await CharacterService_1.characterService.getCharacter(id);
        logger?.info('Character retrieved', { character_id: id });
        res.status(200).json(character);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/characters
 * Create character (curator/super_user)
 */
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const payload = validateCharacterPayload(req.body);
        const character = await CharacterService_1.characterService.createCharacter({
            ...payload,
        }, req.user);
        logger?.info('Character created', { character_id: character.id });
        res.status(201).json(character);
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/characters/:id
 * Update character (curator/super_user)
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Character ID is required');
        }
        const updatePayload = validateCharacterPayload(req.body, true);
        const updated = await CharacterService_1.characterService.updateCharacter(id, updatePayload, req.user);
        logger?.info('Character updated', { character_id: id });
        res.status(200).json(updated);
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/characters/:id
 * Delete character (super_user)
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)('super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Character ID is required');
        }
        await CharacterService_1.characterService.deleteCharacter(id, req.user);
        logger?.info('Character deleted', { character_id: id });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=characters.js.map