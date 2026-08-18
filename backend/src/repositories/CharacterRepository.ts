/**
 * Character Repository
 * Database queries for historical characters
 * See specs/Features.md § 4 for character data model
 */

import { BaseRepository } from './BaseRepository';
import { Character } from '@/types';
import { PoolClient } from 'pg';
import { query, transaction } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class CharacterRepository extends BaseRepository<Character> {
  constructor() {
    super('characters');
  }

  private buildCharacterSelect(whereClause = ''): string {
    return `
      SELECT
        c.*,
        COALESCE(
          array_agg(cf.frame_id ORDER BY cf.position ASC, cf.created_at ASC) FILTER (WHERE cf.frame_id IS NOT NULL),
          ARRAY_REMOVE(ARRAY[c.frame_id], NULL),
          ARRAY[]::uuid[]
        ) AS frame_ids
      FROM characters c
      LEFT JOIN character_frames cf ON cf.character_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
  }

  private normalizeFrameIds(frameIds?: unknown, legacyFrameId?: string | null): string[] {
    if (Array.isArray(frameIds)) {
      const normalized = frameIds
        .filter((frameId): frameId is string => typeof frameId === 'string')
        .map((frameId) => frameId.trim())
        .filter((frameId) => frameId.length > 0);
      return Array.from(new Set(normalized));
    }

    if (typeof legacyFrameId === 'string' && legacyFrameId.trim().length > 0) {
      return [legacyFrameId.trim()];
    }

    return [];
  }

  private async syncCharacterFrames(client: PoolClient, characterId: string, frameIds: string[]): Promise<void> {
    await client.query('DELETE FROM character_frames WHERE character_id = $1', [characterId]);

    if (frameIds.length === 0) {
      return;
    }

    const values: unknown[] = [];
    const placeholders = frameIds
      .map((frameId, index) => {
        const base = index * 3;
        values.push(characterId, frameId, index);
        return `($${base + 1}, $${base + 2}, $${base + 3})`;
      })
      .join(', ');

    await client.query(
      `INSERT INTO character_frames (character_id, frame_id, position)
       VALUES ${placeholders}`,
      values,
    );
  }

  private async fetchById(characterId: string): Promise<Character | null> {
    const result = await query<Character>(this.buildCharacterSelect('WHERE c.id = $1'), [characterId]);
    return result.rows[0] || null;
  }

  private async fetchMany(whereClause: string, values: any[], limit?: number, offset?: number): Promise<{ rows: Character[]; total: number }> {
    const countResult = await query<{ total: number }>(
      `SELECT COUNT(DISTINCT c.id) AS total FROM characters c ${whereClause}`,
      values,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const selectValues = [...values];
    let sql = this.buildCharacterSelect(whereClause);
    if (limit) {
      sql += ` LIMIT $${selectValues.length + 1}`;
      selectValues.push(limit);
    }
    if (offset) {
      sql += ` OFFSET $${selectValues.length + 1}`;
      selectValues.push(offset);
    }

    const result = await query<Character>(sql, selectValues);
    return { rows: result.rows, total };
  }

  async findAll(filters?: Record<string, any>, limit?: number, offset?: number): Promise<{ rows: Character[]; total: number }> {
    try {
      if (!filters || Object.keys(filters).length === 0) {
        return await this.fetchMany('', [], limit, offset);
      }

      const values: any[] = [];
      const conditions = Object.entries(filters).map(([key, value]) => {
        if (value === null) {
          return `c.${key} IS NULL`;
        }
        values.push(value);
        return `c.${key} = $${values.length}`;
      });

      return await this.fetchMany(`WHERE ${conditions.join(' AND ')}`, values, limit, offset);
    } catch (error) {
      defaultLogger.error('Error finding all characters', error as Error);
      throw error;
    }
  }

  async findById(id: string): Promise<Character | null> {
    try {
      return await this.fetchById(id);
    } catch (error) {
      defaultLogger.error('Error finding character by ID', error as Error);
      throw error;
    }
  }

  /**
   * Search characters by name
   */
  async searchByName(searchTerm: string): Promise<Character[]> {
    try {
      const result = await query<Character>(
        this.buildCharacterSelect('WHERE c.name ILIKE $1'),
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
        this.buildCharacterSelect('WHERE EXTRACT(YEAR FROM c.birth_date) = $1'),
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
        this.buildCharacterSelect(),
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
        `
          SELECT
            c.*,
            COALESCE(
              array_agg(cf.frame_id ORDER BY cf.position ASC, cf.created_at ASC) FILTER (WHERE cf.frame_id IS NOT NULL),
              ARRAY_REMOVE(ARRAY[c.frame_id], NULL),
              ARRAY[]::uuid[]
            ) AS frame_ids
          FROM characters c
          LEFT JOIN character_frames cf ON cf.character_id = c.id
          WHERE EXISTS (
            SELECT 1
            FROM events e
            WHERE e.id = $1
              AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(e.characters) elem
                WHERE (
                  (jsonb_typeof(elem) = 'string' AND trim(both '"' from elem::text) = c.name)
                  OR (jsonb_typeof(elem) = 'object' AND elem->>'name' = c.name)
                )
              )
          )
          GROUP BY c.id
          ORDER BY c.name ASC
        `,
        [eventId],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding characters by event', error as Error);
      throw error;
    }
  }

  /**
   * Find characters directly assigned to a historical frame
   */
  async findByFrame(frameId: string): Promise<Character[]> {
    try {
      const result = await query<Character>(
        this.buildCharacterSelect(`WHERE (
          c.frame_id = $1
          OR EXISTS (
            SELECT 1
            FROM character_frames cf_filter
            WHERE cf_filter.character_id = c.id
              AND cf_filter.frame_id = $1
          )
        )`),
        [frameId],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding characters by frame', error as Error);
      throw error;
    }
  }

  async create(data: Partial<Character> & { frame_ids?: string[] }): Promise<Character> {
    try {
      return await transaction(async (client) => {
        const frameIds = this.normalizeFrameIds(data.frame_ids, data.frame_id ?? null);
        const createData: Record<string, unknown> = { ...data };
        delete createData.frame_ids;

        const columns = Object.keys(createData);
        const values = Object.values(createData);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

        const result = await client.query<Character>(
          `INSERT INTO characters (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          values,
        );

        const created = result.rows[0];
        if (!created) {
          throw new Error('Failed to create character');
        }

        await this.syncCharacterFrames(client, created.id, frameIds);
        const refreshed = await client.query<Character>(this.buildCharacterSelect('WHERE c.id = $1'), [created.id]);
        return refreshed.rows[0] || created;
      });
    } catch (error) {
      defaultLogger.error('Error creating character', error as Error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Character> & { frame_ids?: string[] }): Promise<Character | null> {
    try {
      return await transaction(async (client) => {
        const existing = await client.query<Character>(this.buildCharacterSelect('WHERE c.id = $1'), [id]);
        if (!existing.rows[0]) {
          return null;
        }

        const frameIdsProvided = data.frame_ids !== undefined;
        const frameIds = this.normalizeFrameIds(data.frame_ids, data.frame_id ?? null);
        const updateData: Record<string, unknown> = { ...data };
        delete updateData.frame_ids;

        if (frameIdsProvided) {
          updateData.frame_id = frameIds[0] || null;
        }

        const columns = Object.keys(updateData);
        if (columns.length > 0) {
          const values = [...Object.values(updateData), id];
          const updates = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');

          await client.query(
            `UPDATE characters SET ${updates} WHERE id = $${columns.length + 1}`,
            values,
          );
        }

        if (frameIdsProvided) {
          await this.syncCharacterFrames(client, id, frameIds);
        }

        const refreshed = await client.query<Character>(this.buildCharacterSelect('WHERE c.id = $1'), [id]);
        return refreshed.rows[0] || null;
      });
    } catch (error) {
      defaultLogger.error('Error updating character', error as Error);
      throw error;
    }
  }
}

export const characterRepository = new CharacterRepository();

