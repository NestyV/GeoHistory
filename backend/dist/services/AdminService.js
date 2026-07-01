"use strict";
/**
 * Admin Service
 * Business logic for administrative operations
 * Requires super_user role
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const UserRepository_1 = require("@/repositories/UserRepository");
const errors_1 = require("@/utils/errors");
const logger_1 = require("@/utils/logger");
class AdminService {
    /**
     * Get all users (super_user only)
     */
    async getAllUsers(limit, offset) {
        try {
            const { rows, total } = await UserRepository_1.userRepository.findAll({}, limit, offset);
            const users = rows.map(({ password_hash, ...user }) => user);
            return { users, total };
        }
        catch (error) {
            logger_1.defaultLogger.error('Error getting all users', error);
            throw error;
        }
    }
    /**
     * Update user role (super_user only)
     */
    async updateUserRole(userId, newRole, adminUser) {
        try {
            if (!['user', 'curator', 'super_user'].includes(newRole)) {
                throw new Error('Invalid role');
            }
            const user = await UserRepository_1.userRepository.findById(userId);
            if (!user) {
                throw new errors_1.NotFoundError('User', userId);
            }
            const updated = await UserRepository_1.userRepository.updateRole(userId, newRole);
            if (!updated) {
                throw new errors_1.NotFoundError('User', userId);
            }
            const { password_hash, ...result } = updated;
            logger_1.defaultLogger.info('User role updated', {
                admin_id: adminUser.id,
                user_id: userId,
                new_role: newRole,
            });
            return result;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.defaultLogger.error('Error updating user role', error);
            throw error;
        }
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
//# sourceMappingURL=AdminService.js.map