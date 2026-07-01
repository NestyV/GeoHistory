/**
 * PostgreSQL database connection pool
 * Manages connections to the database
 * See specs/Constitution.md § 3 for database architecture
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '@/config';
import { defaultLogger } from '@/utils/logger';

let pool: Pool | null = null;

/**
 * Initialize the database connection pool
 */
export const initializeDatabase = async (): Promise<void> => {
  if (pool) {
    defaultLogger.warn('Database pool already initialized');
    return;
  }

  pool = new Pool({
    connectionString: config.database.url || 
      `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
  });

  pool.on('error', (error) => {
    defaultLogger.error('Unexpected connection error in pool', error);
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
    defaultLogger.info('✓ Database connected successfully');
  } catch (error) {
    defaultLogger.error('Failed to connect to database', error as Error);
    throw error;
  }
};

/**
 * Get the database pool
 */
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
};

/**
 * Execute a query
 */
export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: any[],
): Promise<QueryResult<T>> => {
  const pool = getPool();
  return pool.query<T>(text, values);
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
  const pool = getPool();
  return pool.connect();
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    defaultLogger.info('Database connection pool closed');
  }
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
