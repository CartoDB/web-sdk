/**
 *
 * Base Source definition. We should keep here the code shared between different sources
 */

import { WithEvents } from '@/core/mixins/WithEvents';
import { ColumnFilters } from '../filters/types';

export type GeometryType = 'Point' | 'Line' | 'Polygon';

export type SourceType = 'SQLSource' | 'DatasetSource' | 'DOSource' | 'GeoJSONSource';

export interface Stats {
  min: number;
  max: number;
  avg?: number;
  sum?: number;
  sample?: number[];
  stdev?: number;
  range?: number;
}

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
  geometryType?: GeometryType;
  stats: (NumericFieldStats | CategoryFieldStats)[];
}

export interface SourceProps {
  type: 'TileLayer' | 'GeoJSONLayer';
}

export abstract class Source extends WithEvents {
  // ID of the source. It's mandatory for the source but not for the user.
  public id: string;
  public needsInitialization: boolean;
  public sourceType: SourceType | unknown;
  protected fields: Set<string>;

  constructor(id: string) {
    super();

    this.id = id;
    this.needsInitialization = true;
    this.sourceType = 'Source';
    this.fields = new Set();
    this.registerAvailableEvents(['filterChange']);
  }

  // eslint-disable-next-line class-methods-use-this
  public isEmpty() {
    return false;
  }

  abstract async init(): Promise<boolean>;

  abstract getProps(): SourceProps;

  abstract getMetadata(): SourceMetadata;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  addFilter(_filterId: string, _filter: ColumnFilters) {
    throw new Error(`Method not implemented`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  removeFilter(_filterId: string) {
    throw new Error(`Method not implemented`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async setFilters(_filters: ColumnFilters) {
    throw new Error(`Method not implemented`);
  }

  addField(field: string) {
    const { size } = this.fields;

    this.fields.add(field);

    if (size < this.fields.size) {
      this.needsInitialization = true;
    }
  }
}
