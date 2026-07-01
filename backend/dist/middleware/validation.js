"use strict";
/**
 * Request validation middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailAndPassword = exports.requireFields = void 0;
const errors_1 = require("@/utils/errors");
const requireFields = (...fields) => {
    return (req, _res, next) => {
        for (const field of fields) {
            const value = req.body?.[field];
            if (value === undefined || value === null || value === '') {
                next(new errors_1.ValidationError(`${field} is required`));
                return;
            }
        }
        next();
    };
};
exports.requireFields = requireFields;
const validateEmailAndPassword = (req, _res, next) => {
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        next(new errors_1.ValidationError('Valid email is required'));
        return;
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
        next(new errors_1.ValidationError('Password must be at least 8 characters long'));
        return;
    }
    next();
};
exports.validateEmailAndPassword = validateEmailAndPassword;
//# sourceMappingURL=validation.js.map