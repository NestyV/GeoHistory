"use strict";
/**
 * Health check route
 * Used for uptime monitoring and deployment verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', async (req, res) => {
    const logger = req.logger;
    try {
        logger?.debug('Health check requested');
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    }
    catch (error) {
        const logger = req.logger;
        logger?.error('Health check failed', error);
        res.status(503).json({
            status: 'error',
            message: 'Service unavailable',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map