/**
 * Permission Service
 * Centralized permission checking
 * See specs/Security.md § 1.2 for permission matrix
 */

import { Event, User } from '@/types';

type AuthenticatedUser = Pick<User, 'id' | 'role'>;

export class PermissionService {
  /**
   * Check if user can update event
   */
  static async canUpdateEvent(event: Event, user: AuthenticatedUser): Promise<boolean> {
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
  static async canEditEvent(event: Event, user: AuthenticatedUser): Promise<boolean> {
    return this.canUpdateEvent(event, user);
  }

  /**
   * Check if user can delete event
   */
  static async canDeleteEvent(event: Event, user: AuthenticatedUser): Promise<boolean> {
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
  static canApproveEvent(user: AuthenticatedUser): boolean {
    return user.role === 'curator' || user.role === 'super_user';
  }

  /**
   * Check if user can reject events
   */
  static canRejectEvent(user: AuthenticatedUser): boolean {
    return user.role === 'curator' || user.role === 'super_user';
  }

  /**
   * Check if user can view analytics
   */
  static canViewAnalytics(user: AuthenticatedUser): boolean {
    return user.role === 'super_user';
  }

  /**
   * Check if user can manage users
   */
  static canManageUsers(user: AuthenticatedUser): boolean {
    return user.role === 'super_user';
  }

  /**
   * Generic role checker
   */
  static hasRole(user: AuthenticatedUser, role: 'user' | 'curator' | 'super_user'): boolean {
    if (role === 'user') {
      return true;
    }
    if (role === 'curator') {
      return user.role === 'curator' || user.role === 'super_user';
    }
    return user.role === 'super_user';
  }
}
