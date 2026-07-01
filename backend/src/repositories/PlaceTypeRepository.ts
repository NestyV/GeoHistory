/**
 * PlaceType Repository
 * Database queries for place categories
 * See specs/Features.md § 4 for place type model
 */

import { BaseRepository } from './BaseRepository';
import { PlaceType } from '@/types';

export class PlaceTypeRepository extends BaseRepository<PlaceType> {
  constructor() {
    super('place_types');
  }
}

export const placeTypeRepository = new PlaceTypeRepository();
