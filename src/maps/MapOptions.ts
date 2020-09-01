/**
 * Options currently allowed in Maps API v1
 *
 * @export
 * @interface MapOptions
 */
export interface MapOptions {
  bufferSize?: BufferSizeOptions;
  sql?: string;
  dataset?: string;
  vectorExtent: number;
  vectorSimplifyExtent: number;
  metadata?: {
    geometryType: boolean;
    columnStats?: StatsColumn;
    dimensions?: boolean;
    sample?: Sample;
  };
  aggregation?: {
    placement: string;
    resolution: number;
    threshold?: number;
    columns?: Record<string, AggregationColumn>;
    dimensions?: Record<string, { column: string }>;
  };
}

interface AggregationColumn {
  // eslint-disable-next-line camelcase
  aggregate_function: string;
  // eslint-disable-next-line camelcase
  aggregated_column: string;
}

interface StatsColumn {
  topCategories: number;
  includeNulls: boolean;
}

interface Sample {
  // eslint-disable-next-line camelcase
  num_rows: number;
  // eslint-disable-next-line camelcase
  include_columns: string[];
}

interface BufferSizeOptions {
  png?: number;
  'grid.json'?: number;
  mvt?: number;
}
