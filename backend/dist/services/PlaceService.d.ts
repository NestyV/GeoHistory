/**
 * Place Service
 * Business logic for historical locations
 */
import { Place } from '@/types';
type Actor = {
    id: string;
    role: string;
};
type PlaceInput = Partial<Place> & {
    current_name?: string;
    lat?: number;
    lng?: number;
};
export declare class PlaceService {
    /**
     * Get all places with pagination
     */
    getAllPlaces(limit?: number, offset?: number): Promise<{
        places: Place[];
        total: number;
    }>;
    /**
     * Get place by ID
     */
    getPlaceById(placeId: string): Promise<Place>;
    /**
     * Search places by name
     */
    searchPlaces(searchTerm: string): Promise<Place[]>;
    /**
     * Get places within geographic bounds
     */
    getPlacesByBounds(minLat: number, maxLat: number, minLon: number, maxLon: number): Promise<Place[]>;
    /**
     * Get nearby places
     */
    getNearbyPlaces(latitude: number, longitude: number, distanceKm: number): Promise<Place[]>;
    /**
     * Create place (curator/super_user only)
     */
    createPlace(placeData: PlaceInput, actor: Actor): Promise<Place>;
    /**
     * Update place (curator/super_user only)
     */
    updatePlace(placeId: string, data: PlaceInput, actor: Actor): Promise<Place>;
    /**
     * Delete place (super_user only)
     */
    deletePlace(placeId: string, actor: Actor): Promise<void>;
}
export declare const placeService: PlaceService;
export {};
//# sourceMappingURL=PlaceService.d.ts.map