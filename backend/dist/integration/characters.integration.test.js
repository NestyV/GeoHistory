"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const characters_1 = __importDefault(require("@/routes/characters"));
const errors_1 = require("@/utils/errors");
const CharacterService_1 = require("@/services/CharacterService");
jest.mock('@/services/CharacterService', () => ({
    characterService: {
        getAllCharacters: jest.fn(),
        searchCharacters: jest.fn(),
        getCharactersAliveInYear: jest.fn(),
        getCharacter: jest.fn(),
        createCharacter: jest.fn(),
        updateCharacter: jest.fn(),
        deleteCharacter: jest.fn(),
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
    app.use('/api/characters', characters_1.default);
    app.use(errors_1.errorHandler);
    return app;
};
describe('Characters routes integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('POST /api/characters returns 400 when name is missing', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/characters')
            .set('x-test-role', 'curator')
            .send({ description: 'No name' });
        expect(res.status).toBe(400);
        expect(CharacterService_1.characterService.createCharacter).not.toHaveBeenCalled();
    });
    it('POST /api/characters creates character for curator payload', async () => {
        CharacterService_1.characterService.createCharacter.mockResolvedValue({ id: 'c-1', name: 'Ada' });
        const app = makeApp();
        const res = await (0, supertest_1.default)(app)
            .post('/api/characters')
            .set('x-test-role', 'curator')
            .send({ name: 'Ada', alias: 'A.', description: 'Test' });
        expect(res.status).toBe(201);
        expect(CharacterService_1.characterService.createCharacter).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada', alias: 'A.', description: 'Test' }), expect.objectContaining({ role: 'curator' }));
    });
});
//# sourceMappingURL=characters.integration.test.js.map