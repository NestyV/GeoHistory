"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const auth_1 = require("@/middleware/auth");
const health_1 = __importDefault(require("@/routes/health"));
const errors_1 = require("@/utils/errors");
const makeApp = () => {
    const app = (0, express_1.default)();
    app.use(auth_1.validateTokenFormat);
    app.use('/api', health_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Security middleware integration', () => {
    it('returns 400 for non-Bearer authorization header format', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .get('/api/health')
            .set('Authorization', 'Token abc123');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Authorization header must use Bearer scheme');
    });
    it('allows request with valid Bearer authorization format', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .get('/api/health')
            .set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});
//# sourceMappingURL=security.integration.test.js.map