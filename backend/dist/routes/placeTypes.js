"use strict";
/**
 * Place Types API Routes
 * Frontend compatibility endpoints for place type management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const PlaceTypeRepository_1 = require("@/repositories/PlaceTypeRepository");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const { rows } = await PlaceTypeRepository_1.placeTypeRepository.findAll({}, 200, 0);
        res.status(200).json(rows);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;
        if (!name || typeof name !== 'string') {
            throw new errors_1.ValidationError('Place type name is required');
        }
        const created = await PlaceTypeRepository_1.placeTypeRepository.create({
            name: name.trim(),
            description: description || null,
            icon: icon || null,
            created_at: new Date(),
            updated_at: new Date(),
        });
        res.status(201).json(created);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Place type ID is required');
        }
        const updated = await PlaceTypeRepository_1.placeTypeRepository.update(id, {
            name: req.body.name,
            description: req.body.description,
            icon: req.body.icon,
            updated_at: new Date(),
        });
        if (!updated) {
            res.status(404).json({ error: 'Not Found', message: 'Place type not found' });
            return;
        }
        res.status(200).json(updated);
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new errors_1.ValidationError('Place type ID is required');
        }
        const deleted = await PlaceTypeRepository_1.placeTypeRepository.delete(id);
        if (!deleted) {
            res.status(404).json({ error: 'Not Found', message: 'Place type not found' });
            return;
        }
        res.status(204).send();
        return;
    }
    catch (error) {
        next(error);
        return;
    }
});
exports.default = router;
//# sourceMappingURL=placeTypes.js.map