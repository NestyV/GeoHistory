/**
 * User Repository
 * Database queries for users
 * See specs/Security.md § 1 for user model
 */

import { BaseRepository } from './BaseRepository';
import { User } from '@/types';
import { query } from '@/utils/database';
import { defaultLogger } from '@/utils/logger';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error('Error finding user by email', error as Error);
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: 'user' | 'curator' | 'super_user'): Promise<User[]> {
    try {
      const result = await query<User>(
        'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
        [role],
      );
      return result.rows;
    } catch (error) {
      defaultLogger.error('Error finding users by role', error as Error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: 'user' | 'curator' | 'super_user'): Promise<User | null> {
    try {
      const result = await query<User>(
        `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [role, userId],
      );
      return result.rows[0] || null;
    } catch (error) {
      defaultLogger.error('Error updating user role', error as Error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
