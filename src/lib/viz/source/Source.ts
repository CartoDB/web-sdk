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

  public isInitialized: boolean;

  public sourceType: SourceType | unknown;

  constructor(id: string) {
    super();

    this.id = id;
    this.isInitialized = false;
  }

  abstract async init(fields?: StatFields): Promise<boolean>;

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
}

function getNewFields(newFields: StatFields, currentFields: StatFields): StatFields {
  const newSampleFields = new Set([...newFields.sample].filter(f => !currentFields.sample.has(f)));

  const newAggregationFields = new Set(
    [...newFields.aggregation].filter(f => !currentFields.aggregation.has(f))
  );

  return {
    sample: newSampleFields,
    aggregation: newAggregationFields
  };
}

export function shouldInitialize(
  isInitialized: boolean,
  newFields: StatFields,
  currentFields: StatFields
): boolean {
  if (!isInitialized) {
    return true;
  }

  const difference = getNewFields(newFields, currentFields);
  return difference.sample.size > 0 || difference.aggregation.size > 0;
}