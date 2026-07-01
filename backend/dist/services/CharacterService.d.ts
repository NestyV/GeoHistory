/**
 * Character Service
 * Business logic for historical characters
 */
import { Character } from '@/types';
type Actor = {
    id: string;
    role: string;
};
export declare class CharacterService {
    /**
     * Get all characters with pagination
     */
    getAllCharacters(limit?: number, offset?: number): Promise<{
        characters: Character[];
        total: number;
    }>;
    /**
     * Get character by ID
     */
    getCharacterById(characterId: string): Promise<Character>;
    /**
     * Get character by ID with linked events
     */
    getCharacter(characterId: string): Promise<Character & {
        events: any[];
    }>;
    /**
     * Search characters by name
     */
    searchCharacters(searchTerm: string): Promise<Character[]>;
    /**
     * Get characters alive in a specific year
     */
    getCharactersAliveInYear(year: number): Promise<Character[]>;
    /**
     * Create character (curator/super_user only)
     */
    createCharacter(characterData: Partial<Character> & {
        name?: string;
        description?: string;
    }, actor: Actor): Promise<Character>;
    /**
     * Update character (curator/super_user only)
     */
    updateCharacter(characterId: string, data: Partial<Character>, actor: Actor): Promise<Character>;
    /**
     * Delete character (super_user only)
     */
    deleteCharacter(characterId: string, actor: Actor): Promise<void>;
}
export declare const characterService: CharacterService;
export {};
//# sourceMappingURL=CharacterService.d.ts.map