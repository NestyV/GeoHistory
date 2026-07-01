"use strict";
/**
 * Route exports
 * Centralized import point for all route handlers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = exports.timelineRoutes = exports.placesRoutes = exports.charactersRoutes = exports.eventsRoutes = exports.authRoutes = exports.healthRoutes = void 0;
var health_1 = require("./health");
Object.defineProperty(exports, "healthRoutes", { enumerable: true, get: function () { return __importDefault(health_1).default; } });
var auth_1 = require("./auth");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_1).default; } });
var events_1 = require("./events");
Object.defineProperty(exports, "eventsRoutes", { enumerable: true, get: function () { return __importDefault(events_1).default; } });
var characters_1 = require("./characters");
Object.defineProperty(exports, "charactersRoutes", { enumerable: true, get: function () { return __importDefault(characters_1).default; } });
var places_1 = require("./places");
Object.defineProperty(exports, "placesRoutes", { enumerable: true, get: function () { return __importDefault(places_1).default; } });
var timeline_1 = require("./timeline");
Object.defineProperty(exports, "timelineRoutes", { enumerable: true, get: function () { return __importDefault(timeline_1).default; } });
var admin_1 = require("./admin");
Object.defineProperty(exports, "adminRoutes", { enumerable: true, get: function () { return __importDefault(admin_1).default; } });
//# sourceMappingURL=index.js.map