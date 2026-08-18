/**
 * Character Service
 * Business logic for historical characters
 */

import { Character } from '@/types';
import { characterRepository } from '@/repositories/CharacterRepository';
import { eventRepository } from '@/repositories/EventRepository';
import { query } from '@/utils/database';
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from '@/utils/errors';
import { defaultLogger } from '@/utils/logger';

type Actor = {
  id: string;
  role: string;
};

export class CharacterService {
  private normalizeFrameIds(characterData: Partial<Character> & { frame_ids?: string[] }): string[] | undefined {
    if (characterData.frame_ids !== undefined) {
      return Array.from(
        new Set(
          characterData.frame_ids
            .filter((frameId): frameId is string => typeof frameId === 'string' && frameId.trim().length > 0)
            .map((frameId) => frameId.trim()),
        ),
      );
    }

    if (characterData.frame_id !== undefined) {
      if (typeof characterData.frame_id !== 'string') {
        return [];
      }

      const frameId = characterData.frame_id.trim();
      return frameId ? [frameId] : [];
    }

    return undefined;
  }

  private async validateFrameIds(frameIds: string[]): Promise<void> {
    if (frameIds.length === 0) {
      return;
    }

    const result = await query<{ id: string }>(
      'SELECT id FROM frames WHERE id = ANY($1::uuid[])',
      [frameIds],
    );

    if (result.rows.length !== frameIds.length) {
      const foundIds = new Set(result.rows.map((row) => row.id));
      const missingIds = frameIds.filter((frameId) => !foundIds.has(frameId));
      throw new ValidationError(`Unknown historical frame id(s): ${missingIds.join(', ')}`);
    }
  }

  /**
   * Get all characters with pagination
   */
  async getAllCharacters(limit?: number, offset?: number, frameId?: string): Promise<{ characters: Character[]; total: number }> {
    try {
      if (frameId) {
        const characters = await characterRepository.findByFrame(frameId);
        return { characters, total: characters.length };
      }

      const { rows: characters, total } = await characterRepository.findAll({}, limit, offset);
      return { characters, total };
    } catch (error) {
      defaultLogger.error('Error getting all characters', error as Error);
      throw error;
    }
  }

  /**
   * Get character by ID
   */
  async getCharacterById(characterId: string): Promise<Character> {
    try {
      const character = await characterRepository.findById(characterId);
      if (!character) {
        throw new NotFoundError('Character', characterId);
      }
      return character;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      defaultLogger.error('Error getting character by ID', error as Error);
      throw error;
    }
  }

  /**
   * Get character by ID with linked events
   */
  async getCharacter(characterId: string): Promise<Character & { events: any[] }> {
    const character = await this.getCharacterById(characterId);
    const events = await eventRepository.findByCharacterName(character.name);
    return {
      ...character,
      events,
    };
  }

  /**
   * Search characters by name
   */
  async searchCharacters(searchTerm: string): Promise<Character[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new ValidationError('Search term must be at least 2 characters');
      }
      const characters = await characterRepository.searchByName(searchTerm);
      return characters;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error searching characters', error as Error);
      throw error;
    }
  }

  /**
   * Get characters alive in a specific year
   */
  async getCharactersAliveInYear(year: number): Promise<Character[]> {
    try {
      if (year < 1 || year > new Date().getFullYear()) {
        throw new ValidationError('Invalid year');
      }
      const characters = await characterRepository.findAliveInYear(year);
      return characters;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error getting characters alive in year', error as Error);
      throw error;
    }
  }

  /**
   * Create character (curator/super_user only)
   */
  async createCharacter(characterData: Partial<Character> & { name?: string; description?: string; frame_ids?: string[] }, actor: Actor): Promise<Character> {
    try {
      if (actor.role !== 'curator' && actor.role !== 'super_user') {
        throw new AuthorizationError('Only curators and super users can create characters');
      }

      if (!characterData.name || !characterData.name.trim()) {
        throw new ValidationError('Character name is required');
      }

      const existing = await characterRepository.searchByName(characterData.name.trim());
      if (existing.some((c) => c.name.toLowerCase() === characterData.name!.trim().toLowerCase())) {
        throw new ConflictError('Character with this name already exists');
      }

      const frameIds = this.normalizeFrameIds(characterData) ?? [];
      await this.validateFrameIds(frameIds);

      const created = await characterRepository.create({
        ...characterData,
        name: characterData.name.trim(),
        description: characterData.description || '',
        frame_id: frameIds[0] || null,
        frame_ids: frameIds,
        created_at: new Date(),
      } as Partial<Character>);

      return created;
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      defaultLogger.error('Error creating character', error as Error);
      throw error;
    }
  }

  /**
   * Update character (curator/super_user only)
   */
  async updateCharacter(characterId: string, data: Partial<Character> & { frame_ids?: string[] }, actor: Actor): Promise<Character> {
    try {
      if (actor.role !== 'curator' && actor.role !== 'super_user') {
        throw new AuthorizationError('Only curators and super users can update characters');
      }

      const existing = await this.getCharacterById(characterId);
      if (!existing) {
        throw new NotFoundError('Character', characterId);
      }

      const frameIds = this.normalizeFrameIds(data);
      if (frameIds !== undefined) {
        await this.validateFrameIds(frameIds);
      }

      const updated = await characterRepository.update(characterId, {
        ...data,
        ...(frameIds !== undefined ? { frame_id: frameIds[0] || null, frame_ids: frameIds } : {}),
      } as Partial<Character>);

      if (!updated) {
        throw new NotFoundError('Character', characterId);
      }

      return updated;
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error;
      }
      defaultLogger.error('Error updating character', error as Error);
      throw error;
    }
  }

  /**
   * Delete character (super_user only)
   */
  async deleteCharacter(characterId: string, actor: Actor): Promise<void> {
    try {
      if (actor.role !== 'super_user') {
        throw new AuthorizationError('Only super users can delete characters');
      }

      await this.getCharacterById(characterId);
      await characterRepository.delete(characterId);
    } catch (error) {
      if (error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error;
      }
      defaultLogger.error('Error deleting character', error as Error);
      throw error;
    }
  }
}

export const characterService = new CharacterService();
