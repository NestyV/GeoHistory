"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const admin_1 = __importDefault(require("@/routes/admin"));
const errors_1 = require("@/utils/errors");
const AdminService_1 = require("@/services/AdminService");
jest.mock('@/services/AdminService', () => ({
    adminService: {
        getAllUsers: jest.fn(),
        updateUserRole: jest.fn(),
    },
}));
jest.mock('@/middleware/auth', () => ({
    authenticate: (req, _res, next) => {
        req.user = {
            id: req.get('x-test-user-id') || 'u-1',
            email: 'admin@example.com',
            role: req.get('x-test-role') || 'user',
        };
        next();
    },
    requireRole: (...allowedRoles) => {
        return (req, res, next) => {
            if (!allowedRoles.includes(req.user?.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        };
    },
}));
const makeApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/admin', admin_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Admin routes integration', () => {
    beforeEach(() => {
        AdminService_1.adminService.getAllUsers.mockReset();
        AdminService_1.adminService.updateUserRole.mockReset();
    });
    it('GET /api/admin/users rejects non-super_user', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .get('/api/admin/users')
            .set('x-test-role', 'curator');
        expect(res.status).toBe(403);
    });
    it('GET /api/admin/users allows super_user', async () => {
        AdminService_1.adminService.getAllUsers.mockResolvedValue({
            users: [{ id: 'u-1', email: 'user@example.com', role: 'regular' }],
            total: 1,
        });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .get('/api/admin/users')
            .set('x-test-role', 'super_user');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
        expect(AdminService_1.adminService.getAllUsers).toHaveBeenCalledWith(20, 0);
    });
    it('PUT /api/admin/users/:id/role rejects non-super_user', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .put('/api/admin/users/u-2/role')
            .set('x-test-role', 'curator')
            .send({ role: 'curator' });
        expect(res.status).toBe(403);
    });
    it('PUT /api/admin/users/:id/role allows super_user', async () => {
        AdminService_1.adminService.updateUserRole.mockResolvedValue({
            id: 'u-2',
            email: 'promoted@example.com',
            role: 'curator',
        });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .put('/api/admin/users/u-2/role')
            .set('x-test-role', 'super_user')
            .send({ role: 'curator' });
        expect(res.status).toBe(200);
        expect(AdminService_1.adminService.updateUserRole).toHaveBeenCalledWith('u-2', 'curator', expect.objectContaining({ role: 'super_user' }));
    });
});
//# sourceMappingURL=admin.integration.test.js.map