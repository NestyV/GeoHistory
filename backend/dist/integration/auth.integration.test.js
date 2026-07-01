"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const supertest_1 = __importDefault(require("supertest"));
const auth_1 = __importDefault(require("@/routes/auth"));
const errors_1 = require("@/utils/errors");
const AuthService_1 = require("@/services/AuthService");
jest.mock('@/services/AuthService', () => ({
    authService: {
        register: jest.fn(),
        login: jest.fn(),
        verifyRefreshToken: jest.fn(),
        generateAccessToken: jest.fn(),
        generateRefreshToken: jest.fn(),
        persistRefreshToken: jest.fn(),
        revokeRefreshToken: jest.fn(),
    },
}));
jest.mock('@/middleware/auth', () => ({
    authenticate: (req, _res, next) => {
        req.user = { id: 'u-1', email: 'u@example.com', role: 'user' };
        next();
    },
}));
const makeApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/api/auth', auth_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Auth routes integration', () => {
    it('POST /api/auth/login returns token payload', async () => {
        AuthService_1.authService.login.mockResolvedValue({
            user: { id: 'u-1', email: 'u@example.com', role: 'user' },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ email: 'u@example.com', password: 'Password1234' });
        const setCookieHeader = res.headers['set-cookie'];
        const cookieHeader = Array.isArray(setCookieHeader)
            ? setCookieHeader.join(';')
            : (setCookieHeader || '');
        expect(res.status).toBe(200);
        expect(res.body.access_token).toBe('access-token');
        expect(cookieHeader).toContain('refreshToken=');
    });
    it('POST /api/auth/refresh-token rotates token', async () => {
        AuthService_1.authService.verifyRefreshToken
            .mockResolvedValueOnce({ sub: 'u-1', email: 'u@example.com', role: 'user', jti: 'old-jti', type: 'refresh' })
            .mockResolvedValueOnce({ sub: 'u-1', email: 'u@example.com', role: 'user', jti: 'new-jti', type: 'refresh' });
        AuthService_1.authService.generateAccessToken.mockReturnValue('new-access');
        AuthService_1.authService.generateRefreshToken.mockReturnValue('new-refresh');
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/refresh-token')
            .send({ refresh_token: 'old-refresh' });
        expect(res.status).toBe(200);
        expect(res.body.access_token).toBe('new-access');
        expect(AuthService_1.authService.persistRefreshToken).toHaveBeenCalledWith('new-refresh', 'u-1');
        expect(AuthService_1.authService.revokeRefreshToken).toHaveBeenCalledWith('old-jti', 'new-jti');
    });
    it('POST /api/auth/logout succeeds with auth middleware', async () => {
        AuthService_1.authService.verifyRefreshToken.mockResolvedValue({
            sub: 'u-1',
            email: 'u@example.com',
            role: 'user',
            jti: 'token-jti',
            type: 'refresh',
        });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/logout')
            .send({ refresh_token: 'refresh-token' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Logged out successfully');
    });
    it('POST /api/auth/refresh-token returns 400 when token is missing', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/refresh-token')
            .send({});
        expect(res.status).toBe(400);
        expect(AuthService_1.authService.verifyRefreshToken).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.integration.test.js.map