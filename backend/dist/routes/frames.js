"use strict";
/**
 * Frames API Routes
 * Compatibility routes for historical frames used by frontend pages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const database_1 = require("@/utils/database");
const errors_1 = require("@/utils/errors");
const router = (0, express_1.Router)();
router.get('/', async (_req, res, next) => {
    try {
        const result = await (0, database_1.query)(`SELECT id, name, description, start_date, end_date, created_at
       FROM frames
       ORDER BY start_date ASC NULLS LAST, name ASC`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    try {
        const { name, description, start_date, end_date } = req.body;
        if (!name || typeof name !== 'string') {
            throw new errors_1.ValidationError('Frame name is required');
        }
        const result = await (0, database_1.query)(`INSERT INTO frames (name, description, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, description, start_date, end_date, created_at`, [name.trim(), description || null, start_date || null, end_date || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authenticate, (0, auth_1.requireRole)('curator', 'super_user'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, start_date, end_date } = req.body;
        if (!id) {
            throw new errors_1.ValidationError('Frame ID is required');
        }
        const result = await (0, database_1.query)(`UPDATE frames
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date)
       WHERE id = $5
       RETURNING id, name, description, start_date, end_date, created_at`, [name || null, description || null, start_date || null, end_date || null, id]);
        if (!result.rows[0]) {
            res.status(404).json({ error: 'Not Found', message: 'Frame not found' });
            return;
        }
        res.status(200).json(result.rows[0]);
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
            throw new errors_1.ValidationError('Frame ID is required');
        }
        const result = await (0, database_1.query)('DELETE FROM frames WHERE id = $1', [id]);
        if (!result.rowCount) {
            res.status(404).json({ error: 'Not Found', message: 'Frame not found' });
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
//# sourceMappingURL=frames.js.map