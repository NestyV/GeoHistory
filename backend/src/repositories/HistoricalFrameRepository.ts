/**
 * HistoricalFrame Repository
 * Database queries for historical time periods
 * See specs/Features.md § 4 for historical frame model
 */

import { BaseRepository } from './BaseRepository';
import { HistoricalFrame } from '@/types';
import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class HistoricalFrameRepository extends BaseRepository<HistoricalFrame> {
  constructor() {
    super('historical_frames');
  }

  /**
   * Find frames that contain a specific year
   */
  async findByYear(year: number): Promise<HistoricalFrame[]> {
    try {
      const result = await query<HistoricalFrame>(
        `SELECT * FROM historical_frames 
         WHERE start_year <= $1 
         AND (end_year IS NULL OR end_year >= $1)
         ORDER BY start_year DESC`,
        [year],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding frames by year', error as Error);
      throw error;
    }
  }

  /**
   * Find all frames in chronological order
   */
  async findChronological(): Promise<HistoricalFrame[]> {
    try {
      const result = await query<HistoricalFrame>(
        `SELECT * FROM historical_frames 
         ORDER BY start_year ASC, end_year ASC NULLS LAST`,
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding chronological frames', error as Error);
      throw error;
    }
  }
}

export const historicalFrameRepository = new HistoricalFrameRepository();
