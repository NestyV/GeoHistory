"use strict";
/**
 * HistoricalFrame Repository
 * Database queries for historical time periods
 * See specs/Features.md § 4 for historical frame model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.historicalFrameRepository = exports.HistoricalFrameRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class HistoricalFrameRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('historical_frames');
    }
    /**
     * Find frames that contain a specific year
     */
    async findByYear(year) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM historical_frames 
         WHERE start_year <= $1 
         AND (end_year IS NULL OR end_year >= $1)
         ORDER BY start_year DESC`, [year]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding frames by year', error);
            throw error;
        }
    }
    /**
     * Find all frames in chronological order
     */
    async findChronological() {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM historical_frames 
         ORDER BY start_year ASC, end_year ASC NULLS LAST`);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding chronological frames', error);
            throw error;
        }
    }
}
exports.HistoricalFrameRepository = HistoricalFrameRepository;
exports.historicalFrameRepository = new HistoricalFrameRepository();
//# sourceMappingURL=HistoricalFrameRepository.js.map