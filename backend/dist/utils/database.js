"use strict";
/**
 * PostgreSQL database connection pool
 * Manages connections to the database
 * See specs/Constitution.md § 3 for database architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.closeDatabase = exports.getClient = exports.query = exports.getPool = exports.initializeDatabase = void 0;
const pg_1 = require("pg");
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
let pool = null;
/**
 * Initialize the database connection pool
 */
const initializeDatabase = async () => {
    if (pool) {
        logger_1.defaultLogger.warn('Database pool already initialized');
        return;
    }
    pool = new pg_1.Pool({
        connectionString: config_1.config.database.url ||
            `postgresql://${config_1.config.database.user}:${config_1.config.database.password}@${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.name}`,
    });
    pool.on('error', (error) => {
        logger_1.defaultLogger.error('Unexpected connection error in pool', error);
    });
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        // Ensure auth refresh-token persistence exists for rotation/revocation flow.
        await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_id TEXT UNIQUE NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        replaced_by_token_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id ON refresh_tokens(token_id)');
        // Ensure user preferences persistence exists for map state compatibility endpoints.
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        last_frame_id UUID REFERENCES frames(id) ON DELETE SET NULL,
        last_year INTEGER,
        last_lat DOUBLE PRECISION,
        last_lng DOUBLE PRECISION,
        last_zoom INTEGER,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
        client.release();
        logger_1.defaultLogger.info('✓ Database connected successfully');
    }
    catch (error) {
        logger_1.defaultLogger.error('Failed to connect to database', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
/**
 * Get the database pool
 */
const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initializeDatabase first.');
    }
    return pool;
};
exports.getPool = getPool;
/**
 * Execute a query
 */
const query = async (text, values) => {
    const pool = (0, exports.getPool)();
    return pool.query(text, values);
};
exports.query = query;
/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
    const pool = (0, exports.getPool)();
    return pool.connect();
};
exports.getClient = getClient;
/**
 * Close the database connection pool
 */
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.defaultLogger.info('Database connection pool closed');
    }
};
exports.closeDatabase = closeDatabase;
/**
 * Execute a transaction
 */
const transaction = async (callback) => {
    const client = await (0, exports.getClient)();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
//# sourceMappingURL=database.js.map