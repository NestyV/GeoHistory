"use strict";
/**
 * Admin API Routes
 * Administrative operations - super_user only
 * See specs/Features.md § 3.6 for endpoint specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const AdminService_1 = require("@/services/AdminService");
const EventRepository_1 = require("@/repositories/EventRepository");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/events/pending
 * List pending events (curator/super_user)
 */
router.get('/events/pending', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const events = await EventRepository_1.eventRepository.findByStatus('pending');
        logger?.info('Pending events retrieved', { count: events.length });
        res.status(200).json(events);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/admin/users
 * List all users (super_user only)
 * Requires authentication and super_user role
 */
router.get('/users', auth_1.authenticate, (0, auth_1.requireRole)('super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        if (limit < 1 || limit > 100) {
            throw new errors_1.ValidationError('Limit must be between 1 and 100');
        }
        const { users, total } = await AdminService_1.adminService.getAllUsers(limit, offset);
        logger?.info('Users list retrieved', { count: users.length, total });
        res.status(200).json({
            data: users,
            total,
            limit,
            offset,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/admin/users/:id/role
 * Update user role (super_user only)
 * Requires authentication and super_user role
 */
router.put('/users/:id/role', auth_1.authenticate, (0, auth_1.requireRole)('super_user'), async (req, res, next) => {
    const logger = req.logger;
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!id) {
            throw new errors_1.ValidationError('User ID is required');
        }
        if (!role) {
            throw new errors_1.ValidationError('Role is required');
        }
        const user = await AdminService_1.adminService.updateUserRole(id, role, req.user);
        logger?.info('User role updated', { user_id: id, new_role: role });
        res.status(200).json(user);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map