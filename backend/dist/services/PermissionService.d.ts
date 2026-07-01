/**
 * Permission Service
 * Centralized permission checking
 * See specs/Security.md § 1.2 for permission matrix
 */
import { Event, User } from '@/types';
type AuthenticatedUser = Pick<User, 'id' | 'role'>;
export declare class PermissionService {
    /**
     * Check if user can update event
     */
    static canUpdateEvent(event: Event, user: AuthenticatedUser): Promise<boolean>;
    /**
     * Check if user can edit event (creator for pending events or privileged roles)
     */
    static canEditEvent(event: Event, user: AuthenticatedUser): Promise<boolean>;
    /**
     * Check if user can delete event
     */
    static canDeleteEvent(event: Event, user: AuthenticatedUser): Promise<boolean>;
    /**
     * Check if user can approve events
     */
    static canApproveEvent(user: AuthenticatedUser): boolean;
    /**
     * Check if user can reject events
     */
    static canRejectEvent(user: AuthenticatedUser): boolean;
    /**
     * Check if user can view analytics
     */
    static canViewAnalytics(user: AuthenticatedUser): boolean;
    /**
     * Check if user can manage users
     */
    static canManageUsers(user: AuthenticatedUser): boolean;
    /**
     * Generic role checker
     */
    static hasRole(user: AuthenticatedUser, role: 'user' | 'curator' | 'super_user'): boolean;
}
export {};
//# sourceMappingURL=PermissionService.d.ts.map