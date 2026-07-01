"use strict";
/**
 * Timeline Service
 * Business logic for historical time periods
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timelineService = exports.TimelineService = void 0;
const HistoricalFrameRepository_1 = require("@/repositories/HistoricalFrameRepository");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class TimelineService {
    /**
     * Get all historical frames in chronological order
     */
    async getTimeline() {
        try {
            const frames = await HistoricalFrameRepository_1.historicalFrameRepository.findChronological();
            return frames;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error getting timeline', error);
            throw error;
        }
    }
    /**
     * Get historical frames for a specific year
     */
    async getFramesForYear(year) {
        try {
            if (year < 1 || year > new Date().getFullYear()) {
                throw new errors_1.ValidationError('Invalid year');
            }
            const frames = await HistoricalFrameRepository_1.historicalFrameRepository.findByYear(year);
            return frames;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError)
                throw error;
            logger_1.defaultLogger.error('Error getting frames for year', error);
            throw error;
        }
    }
    /**
     * Get historical frame by ID
     */
    async getFrameById(frameId) {
        try {
            const frame = await HistoricalFrameRepository_1.historicalFrameRepository.findById(frameId);
            if (!frame) {
                throw new errors_1.NotFoundError('Historical Frame', frameId);
            }
            return frame;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.defaultLogger.error('Error getting frame by ID', error);
            throw error;
        }
    }
}
exports.TimelineService = TimelineService;
exports.timelineService = new TimelineService();
//# sourceMappingURL=TimelineService.js.map