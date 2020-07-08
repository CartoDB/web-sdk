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
  geometryType: GeometryType;
  stats: (NumericFieldStats | CategoryFieldStats)[];
}

export interface SourceProps {
  type: 'TileLayer' | 'GeoJSONLayer';
}

export interface StatFields {
  sample: Set<string>;
  aggregation: Set<string>;
}

export abstract class Source extends WithEvents {
  // ID of the source. It's mandatory for the source but not for the user.
  public id: string;
  public shouldInit: boolean;
  public sourceType: SourceType | unknown;
  protected fields: StatFields;

  constructor(id: string) {
    super();

    this.id = id;
    this.shouldInit = true;
    this.sourceType = 'Source';
    this.fields = { sample: new Set(), aggregation: new Set() };
  }

  abstract async init(): Promise<boolean>;

  abstract getProps(): SourceProps;

  abstract getMetadata(): SourceMetadata;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async addFilter(_filterId: string, _filter: ColumnFilters) {
    throw new Error(`Method not implemented`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  async removeFilter(_filterId: string) {
    throw new Error(`Method not implemented`);
  }

  protected async addField(sampleField: string, aggregationField: string) {
    const sampleSize = this.fields.sample.size;
    const aggregationSize = this.fields.aggregation.size;

    this.fields.sample.add(sampleField);
    this.fields.sample.add(aggregationField);

    if (
      !this.shouldInit &&
      (sampleSize < this.fields.sample.size || aggregationSize < this.fields.aggregation.size)
    ) {
      this.shouldInit = true;
      await this.init();
    }
  }
}
