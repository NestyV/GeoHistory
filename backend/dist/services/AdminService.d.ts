/**
 * Admin Service
 * Business logic for administrative operations
 * Requires super_user role
 */
import { User } from '@/types';
export declare class AdminService {
    /**
     * Get all users (super_user only)
     */
    getAllUsers(limit?: number, offset?: number): Promise<{
        users: Omit<User, 'password_hash'>[];
        total: number;
    }>;
    /**
     * Update user role (super_user only)
     */
    updateUserRole(userId: string, newRole: 'user' | 'curator' | 'super_user', adminUser: Omit<User, 'password_hash'>): Promise<Omit<User, 'password_hash'>>;
}
export declare const adminService: AdminService;
//# sourceMappingURL=AdminService.d.ts.map