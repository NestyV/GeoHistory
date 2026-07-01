"use strict";
/**
 * GeoHistory Express Backend Server
 * Entry point for all API endpoints
 * See specs/Constitution.md § 1 and specs/Operations.md § 2 for architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const auth_1 = require("@/middleware/auth");
const logging_1 = require("@/middleware/logging");
const errorHandler_1 = require("@/middleware/errorHandler");
const rateLimit_1 = require("@/middleware/rateLimit");
const database_1 = require("@/utils/database");
// Routes
const health_1 = __importDefault(require("@/routes/health"));
const auth_2 = __importDefault(require("@/routes/auth"));
const events_1 = __importDefault(require("@/routes/events"));
const characters_1 = __importDefault(require("@/routes/characters"));
const places_1 = __importDefault(require("@/routes/places"));
const placeTypes_1 = __importDefault(require("@/routes/placeTypes"));
const frames_1 = __importDefault(require("@/routes/frames"));
const timeline_1 = __importDefault(require("@/routes/timeline"));
const admin_1 = __importDefault(require("@/routes/admin"));
const user_1 = __importDefault(require("@/routes/user"));
// ============================================================================
// SERVER INITIALIZATION
// ============================================================================
const app = (0, express_1.default)();
const PORT = config_1.config.port;
// Validate configuration on startup
try {
    (0, config_1.validateConfig)();
    logger_1.defaultLogger.info('Configuration validated successfully');
}
catch (error) {
    logger_1.defaultLogger.error('Configuration validation failed', error);
    process.exit(1);
}
// Initialize database
let dbInitialized = false;
(0, database_1.initializeDatabase)()
    .then(() => {
    dbInitialized = true;
})
    .catch((error) => {
    logger_1.defaultLogger.error('Database initialization failed', error);
    process.exit(1);
});
// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================
// Security headers
app.use((0, helmet_1.default)());
// CORS
app.use((0, cors_1.default)({
    origin: config_1.config.cors.origin,
    credentials: config_1.config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
}));
// Request logging (must be early)
app.use((0, logging_1.createLoggerMiddleware)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((0, cookie_parser_1.default)());
// Rate limiting
if (config_1.config.rateLimit.enabled) {
    const limiter = (0, rateLimit_1.createGlobalRateLimiter)();
    // Apply to all routes
    app.use(limiter);
    // Stricter limit for auth endpoints
    const sensitiveEndpointLimiter = (0, rateLimit_1.createAuthRateLimiter)();
    app.use('/api/auth/login', sensitiveEndpointLimiter);
    app.use('/api/auth/refresh', sensitiveEndpointLimiter);
    app.use('/api/auth/refresh-token', sensitiveEndpointLimiter);
}
// Token format validation
app.use(auth_1.validateTokenFormat);
// ============================================================================
// REQUEST HANDLERS
// ============================================================================
// Health check (public)
app.use('/api', health_1.default);
// Authentication routes
app.use('/api/auth', auth_2.default);
// Resource routes
app.use('/api/events', events_1.default);
app.use('/api/characters', characters_1.default);
app.use('/api/places', places_1.default);
app.use('/api/place-types', placeTypes_1.default);
app.use('/api/frames', frames_1.default);
app.use('/api/timeline', timeline_1.default);
app.use('/api/user', user_1.default);
// Admin routes (super_user only)
app.use('/api/admin', admin_1.default);
// TODO: Additional features for Phase 3+
// - Event character associations
// - Place type management
// - User preferences and settings
// - Search aggregation endpoint
// ============================================================================
// 404 HANDLER
// ============================================================================
app.use((req, res) => {
    const logger = req.logger;
    logger?.warn('Route not found', { method: req.method, path: req.path });
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        status_code: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
    });
});
// ============================================================================
// ERROR HANDLER (must be last)
// ============================================================================
app.use(errorHandler_1.errorHandler);
// ============================================================================
// SERVER STARTUP
// ============================================================================
const server = app.listen(PORT, () => {
    logger_1.defaultLogger.info('Server started', {
        port: PORT,
        environment: config_1.config.nodeEnv,
        nodeVersion: process.version,
        database_connected: dbInitialized,
    });
    logger_1.defaultLogger.info('Routes available', {
        health: 'GET /api/health',
        auth: 'POST /api/auth/login | POST /api/auth/refresh | POST /api/auth/refresh-token | POST /api/auth/logout',
        events: 'GET/POST /api/events | GET/PUT/DELETE /api/events/:id | POST /api/events/:id/approve|reject',
        characters: 'GET /api/characters | GET /api/characters/:id | GET /api/characters/search/by-name | GET /api/characters/alive-in/:year',
        places: 'GET /api/places | GET /api/places/:id | GET /api/places/search/by-name | GET /api/places/bounds | GET /api/places/nearby',
        place_types: 'GET/POST /api/place-types | PUT/DELETE /api/place-types/:id',
        frames: 'GET/POST /api/frames | PUT/DELETE /api/frames/:id',
        timeline: 'GET /api/timeline | GET /api/timeline/:id | GET /api/timeline/year/:year',
        user: 'GET/POST /api/user/preferences',
        admin: 'GET /api/admin/events/pending (curator/super_user) | GET /api/admin/users | PUT /api/admin/users/:id/role (super_user only)',
    });
});
// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
const gracefulShutdown = async (signal) => {
    logger_1.defaultLogger.info(`Received ${signal} signal, shutting down gracefully...`);
    server.close(() => {
        logger_1.defaultLogger.info('Server closed');
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        logger_1.defaultLogger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_1.defaultLogger.error('Unhandled Rejection at:', promise, {
        reason: String(reason),
    });
});
process.on('uncaughtException', (error) => {
    logger_1.defaultLogger.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map