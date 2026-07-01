/**
 * Timeline Service
 * Business logic for historical time periods
 */
import { HistoricalFrame } from '@/types';
export declare class TimelineService {
    /**
     * Get all historical frames in chronological order
     */
    getTimeline(): Promise<HistoricalFrame[]>;
    /**
     * Get historical frames for a specific year
     */
    getFramesForYear(year: number): Promise<HistoricalFrame[]>;
    /**
     * Get historical frame by ID
     */
    getFrameById(frameId: string): Promise<HistoricalFrame>;
}
export declare const timelineService: TimelineService;
//# sourceMappingURL=TimelineService.d.ts.map