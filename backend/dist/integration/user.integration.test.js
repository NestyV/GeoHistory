"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const user_1 = __importDefault(require("@/routes/user"));
const errors_1 = require("@/utils/errors");
const database_1 = require("@/utils/database");
jest.mock('@/utils/database', () => ({
    query: jest.fn(),
}));
jest.mock('@/middleware/auth', () => ({
    authenticate: (req, _res, next) => {
        req.user = {
            id: req.get('x-test-user-id') || 'u-1',
            email: 'user@example.com',
            role: req.get('x-test-role') || 'user',
        };
        next();
    },
}));
const makeApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/user', user_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('User preferences routes integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('GET /api/user/preferences returns hasPreferences=false when no record', async () => {
        database_1.query.mockResolvedValue({ rows: [] });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/user/preferences');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ hasPreferences: false });
    });
    it('GET /api/user/preferences returns preferences payload when record exists', async () => {
        database_1.query.mockResolvedValue({
            rows: [
                {
                    last_frame_id: 'f-1',
                    last_year: 1910,
                    last_lat: 10.5,
                    last_lng: -70.2,
                    last_zoom: 5,
                },
            ],
        });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/user/preferences');
        expect(res.status).toBe(200);
        expect(res.body.hasPreferences).toBe(true);
        expect(res.body.preferences.last_frame_id).toBe('f-1');
    });
    it('POST /api/user/preferences upserts payload', async () => {
        database_1.query.mockResolvedValue({ rowCount: 1 });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/user/preferences')
            .send({
            last_frame_id: 'f-2',
            last_year: 1944,
            last_lat: 41.4,
            last_lng: 2.1,
            last_zoom: 7,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(database_1.query).toHaveBeenCalled();
    });
    it('POST /api/user/preferences validates integer fields', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/user/preferences')
            .send({ last_year: '1944' });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});
//# sourceMappingURL=user.integration.test.js.map