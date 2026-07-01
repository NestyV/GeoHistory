/**
 * Base Repository class
 * Provides common database operations
 * All repositories extend this class
 */

import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';
import { QueryResultRow } from 'pg';

export abstract class BaseRepository<T extends QueryResultRow> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(
    filters?: Record<string, any>,
    limit?: number,
    offset?: number,
  ): Promise<{ rows: T[]; total: number }> {
    try {
      let whereClause = '';
      const values: any[] = [];
      let paramCount = 1;

      if (filters) {
        const conditions = Object.entries(filters)
          .map(([key, value]) => {
            if (value === null) return `${key} IS NULL`;
            values.push(value);
            return `${key} = $${paramCount++}`;
          });
        if (conditions.length > 0) {
          whereClause = ` WHERE ${conditions.join(' AND ')}`;
        }
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}${whereClause}`;
      const countResult = await query<{ total: number }>(countQuery, values);
      const total = Number(countResult.rows[0]?.total ?? 0);

      // Get paginated results
      let sql = `SELECT * FROM ${this.tableName}${whereClause}`;
      if (limit) {
        sql += ` LIMIT $${paramCount++}`;
        values.push(limit);
      }
      if (offset) {
        sql += ` OFFSET $${paramCount++}`;
        values.push(offset);
      }

      const result = await query<T>(sql, values);
      return { rows: result.rows, total };
    } catch (error) {
      defaultLogger.error(`Error finding all in ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const result = await query<T>(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error(`Error finding by ID in ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Find record by property
   */
  async findByProperty(property: string, value: any): Promise<T | null> {
    try {
      const result = await query<T>(
        `SELECT * FROM ${this.tableName} WHERE ${property} = $1`,
        [value],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error(
        `Error finding by ${property} in ${this.tableName}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Create record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const columns = Object.keys(data);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(data);

      const result = await query<T>(
        `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values,
      );
      const created = result.rows[0];
      if (!created) {
        throw new Error(`Failed to create record in ${this.tableName}`);
      }
      return created;
    } catch (error) {
      defaultLogger.error(`Error creating in ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const columns = Object.keys(data);
      const updates = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id];

      const result = await query<T>(
        `UPDATE ${this.tableName} SET ${updates} WHERE id = $${columns.length + 1} RETURNING *`,
        values,
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error(`Error updating in ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      defaultLogger.error(`Error deleting from ${this.tableName}`, error as Error);
      throw error;
    }
  }
}
