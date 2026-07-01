"use strict";
/**
 * Permission Service
 * Centralized permission checking
 * See specs/Security.md § 1.2 for permission matrix
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
class PermissionService {
    /**
     * Check if user can update event
     */
    static async canUpdateEvent(event, user) {
        // Event owner can update pending events
        if (event.user_id === user.id && event.status === 'pending') {
            return true;
        }
        // Super user can always update
        if (user.role === 'super_user') {
            return true;
        }
        return false;
    }
    /**
     * Check if user can edit event (creator for pending events or privileged roles)
     */
    static async canEditEvent(event, user) {
        return this.canUpdateEvent(event, user);
    }
    /**
     * Check if user can delete event
     */
    static async canDeleteEvent(event, user) {
        // Event owner can delete pending events
        if (event.user_id === user.id && event.status === 'pending') {
            return true;
        }
        // Super user can delete any event
        if (user.role === 'super_user') {
            return true;
        }
        return false;
    }
    /**
     * Check if user can approve events
     */
    static canApproveEvent(user) {
        return user.role === 'curator' || user.role === 'super_user';
    }
    /**
     * Check if user can reject events
     */
    static canRejectEvent(user) {
        return user.role === 'curator' || user.role === 'super_user';
    }
    /**
     * Check if user can view analytics
     */
    static canViewAnalytics(user) {
        return user.role === 'super_user';
    }
    /**
     * Check if user can manage users
     */
    static canManageUsers(user) {
        return user.role === 'super_user';
    }
    /**
     * Generic role checker
     */
    static hasRole(user, role) {
        if (role === 'user') {
            return true;
        }
        if (role === 'curator') {
            return user.role === 'curator' || user.role === 'super_user';
        }
        return user.role === 'super_user';
    }
}
exports.PermissionService = PermissionService;
//# sourceMappingURL=PermissionService.js.map