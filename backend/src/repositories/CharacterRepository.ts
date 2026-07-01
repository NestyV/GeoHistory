/**
 * Character Repository
 * Database queries for historical characters
 * See specs/Features.md § 4 for character data model
 */

import { BaseRepository } from './BaseRepository';
import { Character } from '@/types';
import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class CharacterRepository extends BaseRepository<Character> {
  constructor() {
    super('characters');
  }

  /**
   * Search characters by name
   */
  async searchByName(searchTerm: string): Promise<Character[]> {
    try {
      const result = await query<Character>(
        `SELECT * FROM characters 
         WHERE name ILIKE $1
         ORDER BY name ASC`,
        [`%${searchTerm}%`],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error searching characters by name', error as Error);
      throw error;
    }
  }

  /**
   * Find characters by birth year
   */
  async findByBirthYear(year: number): Promise<Character[]> {
    try {
      const result = await query<Character>(
        `SELECT * FROM characters 
         WHERE EXTRACT(YEAR FROM birth_date) = $1
         ORDER BY birth_date ASC`,
        [year],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding characters by birth year', error as Error);
      throw error;
    }
  }

  /**
   * Find alive characters in a given year
   */
  async findAliveInYear(_year: number): Promise<Character[]> {
    try {
      const result = await query<Character>(
        `SELECT * FROM characters
         ORDER BY name ASC`,
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding alive characters in year', error as Error);
      throw error;
    }
  }

  /**
   * Find characters linked to an event via events.characters JSONB list
   */
  async findByEvent(eventId: string): Promise<Character[]> {
    try {
      const result = await query<Character>(
        `SELECT c.*
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
         ORDER BY c.name ASC`,
        [eventId],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding characters by event', error as Error);
      throw error;
    }
  }
}

export const characterRepository = new CharacterRepository();

