import { AggregationType } from '@/data/operations/aggregation';

export interface MapDataviewsOptions {
  /**
   * column name to aggregate by
   */
  column: string;

  /**
   * operation to perform
   */
  aggregation: AggregationType;

  /**
   * operation to perform
   */
  operation: AggregationType;

  /**
   * The num of categories
   */
  categories?: number;

  /**
   * Column value to aggregate.
   * This param is required when
   * `aggregation` is different than "count"
   */
  operationColumn?: string;

  /**
   * [Maps API parameter name]
   * Same as operationColumn but this is the
   * name which is used by Maps API as parameter
   */
  aggregationColumn?: string;

  /**
   * Bounding box to filter data
   */
  bbox?: number[];

  /**
   * Number of bins to aggregate the data range into
   */
  bins?: number;

  /**
   * Lower limit of the data range, if not present, the lower limit of the actual data will be used.
   */
  start?: number;

  /**
   * Upper limit of the data range, if not present, the upper limit of the actual data will be used.
   */
  end?: number;
}
