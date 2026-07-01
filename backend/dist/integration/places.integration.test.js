"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const places_1 = __importDefault(require("@/routes/places"));
const errors_1 = require("@/utils/errors");
const PlaceService_1 = require("@/services/PlaceService");
jest.mock('@/services/PlaceService', () => ({
    placeService: {
        getAllPlaces: jest.fn(),
        searchPlaces: jest.fn(),
        getPlacesByBounds: jest.fn(),
        getNearbyPlaces: jest.fn(),
        getPlaceById: jest.fn(),
        createPlace: jest.fn(),
        updatePlace: jest.fn(),
        deletePlace: jest.fn(),
    },
}));
jest.mock('@/middleware/auth', () => ({
    authenticate: (req, _res, next) => {
        req.user = {
            id: req.get('x-test-user-id') || 'u-1',
            email: 'curator@example.com',
            role: req.get('x-test-role') || 'curator',
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
    app.use('/api/places', places_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Places routes integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('POST /api/places returns 400 for invalid coordinates', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/places')
            .set('x-test-role', 'curator')
            .send({
            place_type_id: 'pt-1',
            current_name: 'Invalid Place',
            lat: -95,
            lng: 10,
        });
        expect(res.status).toBe(400);
        expect(PlaceService_1.placeService.createPlace).not.toHaveBeenCalled();
    });
    it('POST /api/places creates place with valid payload', async () => {
        PlaceService_1.placeService.createPlace.mockResolvedValue({ id: 'p-1', name: 'Asuncion' });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/places')
            .set('x-test-role', 'curator')
            .send({
            place_type_id: 'pt-1',
            current_name: 'Asuncion',
            lat: -25.2,
            lng: -57.6,
        });
        expect(res.status).toBe(201);
        expect(PlaceService_1.placeService.createPlace).toHaveBeenCalledWith(expect.objectContaining({
            place_type_id: 'pt-1',
            current_name: 'Asuncion',
            lat: -25.2,
            lng: -57.6,
        }), expect.objectContaining({ role: 'curator' }));
    });
    it('GET /api/places/nearby returns 400 for invalid coordinates', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/places/nearby?lat=abc&lng=-57.6&radius=10');
        expect(res.status).toBe(400);
        expect(PlaceService_1.placeService.getNearbyPlaces).not.toHaveBeenCalled();
    });
    it('GET /api/places/bounds returns 400 for invalid bounds values', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/places/bounds?minLat=0&maxLat=10&minLon=foo&maxLon=20');
        expect(res.status).toBe(400);
        expect(PlaceService_1.placeService.getPlacesByBounds).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=places.integration.test.js.map