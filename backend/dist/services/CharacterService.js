"use strict";
/**
 * Character Service
 * Business logic for historical characters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterService = exports.CharacterService = void 0;
const CharacterRepository_1 = require("@/repositories/CharacterRepository");
const EventRepository_1 = require("@/repositories/EventRepository");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class CharacterService {
    /**
     * Get all characters with pagination
     */
    async getAllCharacters(limit, offset) {
        try {
            const { rows: characters, total } = await CharacterRepository_1.characterRepository.findAll({}, limit, offset);
            return { characters, total };
        }
        catch (error) {
            logger_1.defaultLogger.error('Error getting all characters', error);
            throw error;
        }
    }
    /**
     * Get character by ID
     */
    async getCharacterById(characterId) {
        try {
            const character = await CharacterRepository_1.characterRepository.findById(characterId);
            if (!character) {
                throw new errors_1.NotFoundError('Character', characterId);
            }
            return character;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.defaultLogger.error('Error getting character by ID', error);
            throw error;
        }
    }
    /**
     * Get character by ID with linked events
     */
    async getCharacter(characterId) {
        const character = await this.getCharacterById(characterId);
        const events = await EventRepository_1.eventRepository.findByCharacterName(character.name);
        return {
            ...character,
            events,
        };
    }
    /**
     * Search characters by name
     */
    async searchCharacters(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length < 2) {
                throw new errors_1.ValidationError('Search term must be at least 2 characters');
            }
            const characters = await CharacterRepository_1.characterRepository.searchByName(searchTerm);
            return characters;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error searching characters', error);
            throw error;
        }
    }
    /**
     * Get characters alive in a specific year
     */
    async getCharactersAliveInYear(year) {
        try {
            if (year < 1 || year > new Date().getFullYear()) {
                throw new errors_1.ValidationError('Invalid year');
            }
            const characters = await CharacterRepository_1.characterRepository.findAliveInYear(year);
            return characters;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error getting characters alive in year', error);
            throw error;
        }
    }
    /**
     * Create character (curator/super_user only)
     */
    async createCharacter(characterData, actor) {
        try {
            if (actor.role !== 'curator' && actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only curators and super users can create characters');
            }
            if (!characterData.name || !characterData.name.trim()) {
                throw new errors_1.ValidationError('Character name is required');
            }
            const existing = await CharacterRepository_1.characterRepository.searchByName(characterData.name.trim());
            if (existing.some((c) => c.name.toLowerCase() === characterData.name.trim().toLowerCase())) {
                throw new errors_1.ConflictError('Character with this name already exists');
            }
            const created = await CharacterRepository_1.characterRepository.create({
                ...characterData,
                name: characterData.name.trim(),
                description: characterData.description || '',
                created_at: new Date(),
            });
            return created;
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.ValidationError || error instanceof errors_1.ConflictError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error creating character', error);
            throw error;
        }
    }
    /**
     * Update character (curator/super_user only)
     */
    async updateCharacter(characterId, data, actor) {
        try {
            if (actor.role !== 'curator' && actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only curators and super users can update characters');
            }
            const existing = await this.getCharacterById(characterId);
            if (!existing) {
                throw new errors_1.NotFoundError('Character', characterId);
            }
            const updated = await CharacterRepository_1.characterRepository.update(characterId, {
                ...data,
            });
            if (!updated) {
                throw new errors_1.NotFoundError('Character', characterId);
            }
            return updated;
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error updating character', error);
            throw error;
        }
    }
    /**
     * Delete character (super_user only)
     */
    async deleteCharacter(characterId, actor) {
        try {
            if (actor.role !== 'super_user') {
                throw new errors_1.AuthorizationError('Only super users can delete characters');
            }
            await this.getCharacterById(characterId);
            await CharacterRepository_1.characterRepository.delete(characterId);
        }
        catch (error) {
            if (error instanceof errors_1.AuthorizationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            logger_1.defaultLogger.error('Error deleting character', error);
            throw error;
        }
    }
}
exports.CharacterService = CharacterService;
exports.characterService = new CharacterService();
//# sourceMappingURL=CharacterService.js.map