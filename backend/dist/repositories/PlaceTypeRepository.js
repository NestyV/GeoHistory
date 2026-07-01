"use strict";
/**
 * PlaceType Repository
 * Database queries for place categories
 * See specs/Features.md § 4 for place type model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeTypeRepository = exports.PlaceTypeRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PlaceTypeRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('place_types');
    }
}
exports.PlaceTypeRepository = PlaceTypeRepository;
exports.placeTypeRepository = new PlaceTypeRepository();
//# sourceMappingURL=PlaceTypeRepository.js.map