/**
 * Timeline Service
 * Business logic for historical time periods
 */

import { HistoricalFrame } from '@/types';
import { historicalFrameRepository } from '@/repositories/HistoricalFrameRepository';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { defaultLogger } from '@/utils/logger';

export class TimelineService {
  /**
   * Get all historical frames in chronological order
   */
  async getTimeline(): Promise<HistoricalFrame[]> {
    try {
      const frames = await historicalFrameRepository.findChronological();
      return frames;
    } catch (error) {
      defaultLogger.error('Error getting timeline', error as Error);
      throw error;
    }
  }

  /**
   * Get historical frames for a specific year
   */
  async getFramesForYear(year: number): Promise<HistoricalFrame[]> {
    try {
      if (year < 1 || year > new Date().getFullYear()) {
        throw new ValidationError('Invalid year');
      }
      const frames = await historicalFrameRepository.findByYear(year);
      return frames;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      defaultLogger.error('Error getting frames for year', error as Error);
      throw error;
    }
  }

  /**
   * Get historical frame by ID
   */
  async getFrameById(frameId: string): Promise<HistoricalFrame> {
    try {
      const frame = await historicalFrameRepository.findById(frameId);
      if (!frame) {
        throw new NotFoundError('Historical Frame', frameId);
      }
      return frame;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      defaultLogger.error('Error getting frame by ID', error as Error);
      throw error;
    }
  }
}

export const timelineService = new TimelineService();
