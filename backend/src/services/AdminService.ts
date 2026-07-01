/**
 * Admin Service
 * Business logic for administrative operations
 * Requires super_user role
 */

import { User } from '@/types';
import { userRepository } from '@/repositories/UserRepository';
import { NotFoundError } from '@/utils/errors';
import { defaultLogger } from '@/utils/logger';

export class AdminService {
  /**
   * Get all users (super_user only)
   */
  async getAllUsers(limit?: number, offset?: number): Promise<{ users: Omit<User, 'password_hash'>[]; total: number }> {
    try {
      const { rows, total } = await userRepository.findAll({}, limit, offset);
      const users = rows.map(({ password_hash, ...user }) => user);
      return { users, total };
    } catch (error) {
      defaultLogger.error('Error getting all users', error as Error);
      throw error;
    }
  }

  /**
   * Update user role (super_user only)
   */
  async updateUserRole(
    userId: string,
    newRole: 'user' | 'curator' | 'super_user',
    adminUser: Omit<User, 'password_hash'>,
  ): Promise<Omit<User, 'password_hash'>> {
    try {
      if (!['user', 'curator', 'super_user'].includes(newRole)) {
        throw new Error('Invalid role');
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const updated = await userRepository.updateRole(userId, newRole);
      if (!updated) {
        throw new NotFoundError('User', userId);
      }

      const { password_hash, ...result } = updated;
      defaultLogger.info('User role updated', {
        admin_id: adminUser.id,
        user_id: userId,
        new_role: newRole,
      });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      defaultLogger.error('Error updating user role', error as Error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
