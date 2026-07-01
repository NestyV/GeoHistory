"use strict";
/**
 * User Repository
 * Database queries for users
 * See specs/Security.md § 1 for user model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const database_1 = require("@/utils/database");
const logger_1 = require("@/utils/logger");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('users');
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding user by email', error);
            throw error;
        }
    }
    /**
     * Find users by role
     */
    async findByRole(role) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC', [role]);
            return result.rows;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error finding users by role', error);
            throw error;
        }
    }
    /**
     * Update user role
     */
    async updateRole(userId, role) {
        try {
            const result = await (0, database_1.query)(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [role, userId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.defaultLogger.error('Error updating user role', error);
            throw error;
        }
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=UserRepository.js.map