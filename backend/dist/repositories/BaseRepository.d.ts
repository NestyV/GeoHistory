/**
 * Base Repository class
 * Provides common database operations
 * All repositories extend this class
 */
import { QueryResultRow } from 'pg';
export declare abstract class BaseRepository<T extends QueryResultRow> {
    protected tableName: string;
    constructor(tableName: string);
    /**
     * Find all records with optional filtering
     */
    findAll(filters?: Record<string, any>, limit?: number, offset?: number): Promise<{
        rows: T[];
        total: number;
    }>;
    /**
     * Find record by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Find record by property
     */
    findByProperty(property: string, value: any): Promise<T | null>;
    /**
     * Create record
     */
    create(data: Partial<T>): Promise<T>;
    /**
     * Update record
     */
    update(id: string, data: Partial<T>): Promise<T | null>;
    /**
     * Delete record
     */
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=BaseRepository.d.ts.map