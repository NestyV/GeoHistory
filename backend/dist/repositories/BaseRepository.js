"use strict";
/**
 * Base Repository class
 * Provides common database operations
 * All repositories extend this class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }
    /**
     * Find all records with optional filtering
     */
    async findAll(filters, limit, offset) {
        try {
            let whereClause = '';
            const values = [];
            let paramCount = 1;
            if (filters) {
                const conditions = Object.entries(filters)
                    .map(([key, value]) => {
                    if (value === null)
                        return `${key} IS NULL`;
                    values.push(value);
                    return `${key} = $${paramCount++}`;
                });
                if (conditions.length > 0) {
                    whereClause = ` WHERE ${conditions.join(' AND ')}`;
                }
            }
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}${whereClause}`;
            const countResult = await (0, database_1.query)(countQuery, values);
            const total = Number(countResult.rows[0]?.total ?? 0);
            // Get paginated results
            let sql = `SELECT * FROM ${this.tableName}${whereClause}`;
            if (limit) {
                sql += ` LIMIT $${paramCount++}`;
                values.push(limit);
            }
            if (offset) {
                sql += ` OFFSET $${paramCount++}`;
                values.push(offset);
            }
            const result = await (0, database_1.query)(sql, values);
            return { rows: result.rows, total };
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error finding all in ${this.tableName}`, error);
            throw error;
        }
    }
    /**
     * Find record by ID
     */
    async findById(id) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error finding by ID in ${this.tableName}`, error);
            throw error;
        }
    }
    /**
     * Find record by property
     */
    async findByProperty(property, value) {
        try {
            const result = await (0, database_1.query)(`SELECT * FROM ${this.tableName} WHERE ${property} = $1`, [value]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error finding by ${property} in ${this.tableName}`, error);
            throw error;
        }
    }
    /**
     * Create record
     */
    async create(data) {
        try {
            const columns = Object.keys(data);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const values = Object.values(data);
            const result = await (0, database_1.query)(`INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
            const created = result.rows[0];
            if (!created) {
                throw new Error(`Failed to create record in ${this.tableName}`);
            }
            return created;
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error creating in ${this.tableName}`, error);
            throw error;
        }
    }
    /**
     * Update record
     */
    async update(id, data) {
        try {
            const columns = Object.keys(data);
            const updates = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
            const values = [...Object.values(data), id];
            const result = await (0, database_1.query)(`UPDATE ${this.tableName} SET ${updates} WHERE id = $${columns.length + 1} RETURNING *`, values);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error updating in ${this.tableName}`, error);
            throw error;
        }
    }
    /**
     * Delete record
     */
    async delete(id) {
        try {
            const result = await (0, database_1.query)(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            logger_1.defaultLogger.error(`Error deleting from ${this.tableName}`, error);
            throw error;
        }
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map