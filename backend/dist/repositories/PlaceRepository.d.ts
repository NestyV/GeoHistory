/**
 * Place Repository
 * Database queries for historical locations
 * See specs/Features.md § 4 for place data model
 */
import { BaseRepository } from './BaseRepository';
import { Place } from '@/types';
export declare class PlaceRepository extends BaseRepository<Place> {
    constructor();
    findAll(_filters?: Record<string, any>, limit?: number, offset?: number): Promise<{
        rows: Place[];
        total: number;
    }>;
    findById(id: string): Promise<Place | null>;
    create(data: Partial<Place>): Promise<Place>;
    update(id: string, data: Partial<Place>): Promise<Place | null>;
    /**
     * Find places by type
     */
    findByPlaceType(placeTypeId: string): Promise<Place[]>;
    /**
     * Search places by name
     */
    searchByName(searchTerm: string): Promise<Place[]>;
    /**
     * Find places within geographic bounds
     */
    findByBounds(minLat: number, maxLat: number, minLon: number, maxLon: number): Promise<Place[]>;
    /**
     * Get nearby places (within distance)
     */
    findNearby(latitude: number, longitude: number, distanceKm: number): Promise<Place[]>;
}
export declare const placeRepository: PlaceRepository;
//# sourceMappingURL=PlaceRepository.d.ts.map