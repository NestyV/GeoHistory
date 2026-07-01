/**
 * GeoHistory Express Backend Server
 * Entry point for all API endpoints
 * See specs/Constitution.md § 1 and specs/Operations.md § 2 for architecture
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { config, validateConfig } from '@/config';
import { defaultLogger } from '@/utils/logger';
import { validateTokenFormat } from '@/middleware/auth';
import { createLoggerMiddleware } from '@/middleware/logging';
import { errorHandler } from '@/middleware/errorHandler';
import { createAuthRateLimiter, createGlobalRateLimiter } from '@/middleware/rateLimit';
import { initializeDatabase } from '@/utils/database';

// Routes
import healthRoutes from '@/routes/health';
import authRoutes from '@/routes/auth';
import eventsRoutes from '@/routes/events';
import charactersRoutes from '@/routes/characters';
import placesRoutes from '@/routes/places';
import placeTypesRoutes from '@/routes/placeTypes';
import framesRoutes from '@/routes/frames';
import timelineRoutes from '@/routes/timeline';
import adminRoutes from '@/routes/admin';
import userRoutes from '@/routes/user';

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const app = express();
const PORT = config.port;

// Validate configuration on startup
try {
  validateConfig();
  defaultLogger.info('Configuration validated successfully');
} catch (error) {
  defaultLogger.error('Configuration validation failed', error as Error);
  process.exit(1);
}

// Initialize database
let dbInitialized = false;
initializeDatabase()
  .then(() => {
    dbInitialized = true;
  })
  .catch((error) => {
    defaultLogger.error('Database initialization failed', error as Error);
    process.exit(1);
  });

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  }),
);

// Request logging (must be early)
app.use(createLoggerMiddleware());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Rate limiting
if (config.rateLimit.enabled) {
  const limiter = createGlobalRateLimiter();

  // Apply to all routes
  app.use(limiter);

  // Stricter limit for auth endpoints
  const sensitiveEndpointLimiter = createAuthRateLimiter();

  app.use('/api/auth/login', sensitiveEndpointLimiter);
  app.use('/api/auth/refresh', sensitiveEndpointLimiter);
  app.use('/api/auth/refresh-token', sensitiveEndpointLimiter);
}

// Token format validation
app.use(validateTokenFormat);

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

// Health check (public)
app.use('/api', healthRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Resource routes
app.use('/api/events', eventsRoutes);
app.use('/api/characters', charactersRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/place-types', placeTypesRoutes);
app.use('/api/frames', framesRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/user', userRoutes);

// Admin routes (super_user only)
app.use('/api/admin', adminRoutes);

// TODO: Additional features for Phase 3+
// - Event character associations
// - Place type management
// - User preferences and settings
// - Search aggregation endpoint

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
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

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  defaultLogger.info('Server started', {
    port: PORT,
    environment: config.nodeEnv,
    nodeVersion: process.version,
    database_connected: dbInitialized,
  });

  defaultLogger.info('Routes available', {
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

const gracefulShutdown = async (signal: string) => {
  defaultLogger.info(`Received ${signal} signal, shutting down gracefully...`);

  server.close(() => {
    defaultLogger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    defaultLogger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  defaultLogger.error('Unhandled Rejection at:', promise as any, {
    reason: String(reason),
  });
});

process.on('uncaughtException', (error) => {
  defaultLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
