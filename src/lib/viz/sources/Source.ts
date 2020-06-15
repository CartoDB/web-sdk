/**
 *
 * Base Source definition. We should keep here the code shared between different sources
 */

import { Stats } from '../utils/Classifier';
import { Filterable } from '../filters/Filterable';
import { ColumnFilters } from '../filters/types';

export type GeometryType = 'Point' | 'Line' | 'Polygon';

export interface NumericFieldStats extends Stats {
  name: string;
}

export interface Category {
  category: string;
  frequency: number;
}

export interface CategoryFieldStats {
  name: string;
  categories: Category[];
}

export interface SourceMetadata {
  geometryType: GeometryType;
  stats: (NumericFieldStats | CategoryFieldStats)[];
}

export interface SourceProps {
  type: 'TileLayer';
}

export interface Field {
  column: string;
  sample: boolean;
  aggregation: boolean;
}

export abstract class Source extends Filterable {
  // ID of the source. It's mandatory for the source but not for the user.
  public id: string;

  public isInitialized: boolean;

  constructor(id: string) {
    super();

    this.id = id;
    this.isInitialized = false;
  }

  abstract async init(fields?: Field[]): Promise<boolean>;

  abstract getProps(): SourceProps;

  abstract getMetadata(): SourceMetadata;

  // eslint-disable-next-line class-methods-use-this
  async addFilter(filterId: string, filter: ColumnFilters) {
    throw new Error(`Method not implemented`);
  }

  // eslint-disable-next-line class-methods-use-this
  async removeFilter(filterId: string) {
    throw new Error(`Method not implemented`);
  }
}
