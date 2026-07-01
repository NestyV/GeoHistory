"use strict";
/**
 * Timeline API Routes
 * Historical time periods and events
 * See specs/Features.md § 3.5 for endpoint specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TimelineService_1 = require("@/services/TimelineService");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
/**
 * GET /api/timeline
 * Get complete timeline in chronological order
 * Public endpoint
 */
router.get('/', async (req, res, next) => {
    const logger = req.logger;
    try {
        const frames = await TimelineService_1.timelineService.getTimeline();
        logger?.info('Timeline retrieved', { frame_count: frames.length });
        res.status(200).json({
            data: frames,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/timeline/:id
 * Get specific historical frame
 * Public endpoint
 */
router.get('/:id', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Frame ID is required');
        }
        const frame = await TimelineService_1.timelineService.getFrameById(id);
        logger?.info('Historical frame retrieved', { frame_id: id });
        res.status(200).json(frame);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/timeline/year/:year
 * Get historical frames for a specific year
 * Public endpoint
 */
router.get('/year/:year', async (req, res, next) => {
    const logger = req.logger;
    try {
        const { year: yearParam } = req.params;
        if (!yearParam) {
            throw new errors_1.ValidationError('Year is required');
        }
        const year = parseInt(yearParam, 10);
        if (isNaN(year)) {
            throw new errors_1.ValidationError('Year must be a valid number');
        }
        const frames = await TimelineService_1.timelineService.getFramesForYear(year);
        logger?.info('Historical frames for year retrieved', { year, frame_count: frames.length });
        res.status(200).json({
            data: frames,
            year,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=timeline.js.map