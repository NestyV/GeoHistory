"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const events_1 = __importDefault(require("@/routes/events"));
const errors_1 = require("@/utils/errors");
const EventService_1 = require("@/services/EventService");
const EventRepository_1 = require("@/repositories/EventRepository");
jest.mock('@/services/EventService', () => ({
    eventService: {
        getAllApprovedEvents: jest.fn(),
        getEventById: jest.fn(),
        createEvent: jest.fn(),
        updateEvent: jest.fn(),
        deleteEvent: jest.fn(),
        approveEvent: jest.fn(),
        rejectEvent: jest.fn(),
    },
}));
jest.mock('@/repositories/EventRepository', () => ({
    eventRepository: {
        findByUserId: jest.fn(),
    },
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
    app.use('/api/events', events_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Events routes integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('POST /api/events creates an event for authenticated user', async () => {
        EventService_1.eventService.createEvent.mockResolvedValue({ id: 'event-1', status: 'pending' });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events')
            .send({
            title: 'Test Event',
            event_date: '2026-01-01',
            location: 'Somewhere',
            lat: 1,
            lng: 2,
        });
        expect(res.status).toBe(201);
        expect(EventService_1.eventService.createEvent).toHaveBeenCalled();
    });
    it('POST /api/events returns 400 for invalid coordinates', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events')
            .send({
            title: 'Test Event',
            event_date: '2026-01-01',
            lat: 120,
            lng: 2,
        });
        expect(res.status).toBe(400);
        expect(EventService_1.eventService.createEvent).not.toHaveBeenCalled();
    });
    it('POST /api/events/:id/approve rejects non-curator role', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events/event-1/approve')
            .set('x-test-role', 'user');
        expect(res.status).toBe(403);
    });
    it('POST /api/events/:id/approve allows curator role', async () => {
        EventService_1.eventService.approveEvent.mockResolvedValue({ id: 'event-1', status: 'approved' });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events/event-1/approve')
            .set('x-test-role', 'curator');
        expect(res.status).toBe(200);
        expect(EventService_1.eventService.approveEvent).toHaveBeenCalled();
    });
    it('POST /api/events/:id/approve allows super_user role', async () => {
        EventService_1.eventService.approveEvent.mockResolvedValue({ id: 'event-1', status: 'approved' });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events/event-1/approve')
            .set('x-test-role', 'super_user');
        expect(res.status).toBe(200);
        expect(EventService_1.eventService.approveEvent).toHaveBeenCalled();
    });
    it('POST /api/events/:id/reject rejects non-curator role', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/events/event-1/reject')
            .set('x-test-role', 'user')
            .send({ reason: 'invalid' });
        expect(res.status).toBe(403);
    });
    it('GET /api/events/my returns authenticated user events', async () => {
        EventRepository_1.eventRepository.findByUserId.mockResolvedValue([{ id: 'event-1', user_id: 'u-1' }]);
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .get('/api/events/my')
            .set('x-test-user-id', 'u-1');
        expect(res.status).toBe(200);
        expect(EventRepository_1.eventRepository.findByUserId).toHaveBeenCalledWith('u-1');
        expect(res.body).toEqual([{ id: 'event-1', user_id: 'u-1' }]);
    });
    it('GET /api/events returns 400 for invalid pagination limit', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/events?limit=0');
        expect(res.status).toBe(400);
        expect(EventService_1.eventService.getAllApprovedEvents).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=events.integration.test.js.map