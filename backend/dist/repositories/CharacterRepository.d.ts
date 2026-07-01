/**
 * Character Repository
 * Database queries for historical characters
 * See specs/Features.md § 4 for character data model
 */
import { BaseRepository } from './BaseRepository';
import { Character } from '@/types';
export declare class CharacterRepository extends BaseRepository<Character> {
    constructor();
    /**
     * Search characters by name
     */
    searchByName(searchTerm: string): Promise<Character[]>;
    /**
     * Find characters by birth year
     */
    findByBirthYear(year: number): Promise<Character[]>;
    /**
     * Find alive characters in a given year
     */
    findAliveInYear(_year: number): Promise<Character[]>;
    /**
     * Find characters linked to an event via events.characters JSONB list
     */
    findByEvent(eventId: string): Promise<Character[]>;
}
export declare const characterRepository: CharacterRepository;
//# sourceMappingURL=CharacterRepository.d.ts.map