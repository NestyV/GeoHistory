/**
 * PostgreSQL database connection pool
 * Manages connections to the database
 * See specs/Constitution.md § 3 for database architecture
 */
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
/**
 * Initialize the database connection pool
 */
export declare const initializeDatabase: () => Promise<void>;
/**
 * Get the database pool
 */
export declare const getPool: () => Pool;
/**
 * Execute a query
 */
export declare const query: <T extends QueryResultRow = QueryResultRow>(text: string, values?: any[]) => Promise<QueryResult<T>>;
/**
 * Get a client from the pool for transactions
 */
export declare const getClient: () => Promise<PoolClient>;
/**
 * Close the database connection pool
 */
export declare const closeDatabase: () => Promise<void>;
/**
 * Execute a transaction
 */
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
//# sourceMappingURL=database.d.ts.map