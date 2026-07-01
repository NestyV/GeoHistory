/**
 * HistoricalFrame Repository
 * Database queries for historical time periods
 * See specs/Features.md § 4 for historical frame model
 */
import { BaseRepository } from './BaseRepository';
import { HistoricalFrame } from '@/types';
export declare class HistoricalFrameRepository extends BaseRepository<HistoricalFrame> {
    constructor();
    /**
     * Find frames that contain a specific year
     */
    findByYear(year: number): Promise<HistoricalFrame[]>;
    /**
     * Find all frames in chronological order
     */
    findChronological(): Promise<HistoricalFrame[]>;
}
export declare const historicalFrameRepository: HistoricalFrameRepository;
//# sourceMappingURL=HistoricalFrameRepository.d.ts.map