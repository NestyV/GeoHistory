/**
 * User Repository
 * Database queries for users
 * See specs/Security.md § 1 for user model
 */
import { BaseRepository } from './BaseRepository';
import { User } from '@/types';
export declare class UserRepository extends BaseRepository<User> {
    constructor();
    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<User | null>;
    /**
     * Find users by role
     */
    findByRole(role: 'user' | 'curator' | 'super_user'): Promise<User[]>;
    /**
     * Update user role
     */
    updateRole(userId: string, role: 'user' | 'curator' | 'super_user'): Promise<User | null>;
}
export declare const userRepository: UserRepository;
//# sourceMappingURL=UserRepository.d.ts.map