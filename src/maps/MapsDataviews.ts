import { AggregationType } from '@/data/operations/aggregation';
import { uuidv4 } from '@/core/utils/uuid';
import { Credentials } from '../auth';
import { MapsApiClient } from './MapsApiClient';
import { MapDataviewsOptions } from './MapDataviewsOptions';

export class MapsDataviews {
  private _source: string;
  private _mapClient: MapsApiClient;
  private _layergroupCache: Record<string, any>;

  constructor(source: string, credentials: Credentials) {
    this._source = source;
    this._mapClient = new MapsApiClient(credentials);
    this._layergroupCache = {};
  }

  public async aggregation(params: Partial<MapDataviewsOptions>): Promise<AggregationResponse> {
    const { column, aggregation, aggregationColumn, categories, bbox } = params;
    const dataviewName = this.getDataviewName();

    const layergroup = await this._createMapWithDataviews(dataviewName, 'aggregation', {
      column,
      aggregation,
      aggregationColumn
    });

    const aggregationResponse = this._mapClient.dataview(layergroup, {
      categories,
      bbox
    });

    return (aggregationResponse as unknown) as AggregationResponse;
  }

  public async formula(params: FormulaParameters) {
    const { column, operation, bbox } = params;
    const dataviewName = this.getDataviewName();

    const layergroup = await this._createMapWithDataviews(dataviewName, 'formula', {
      operation,
      column
    });

    const formulaResponse = this._mapClient.dataview(layergroup, { bbox });

    return (formulaResponse as unknown) as FormulaResponse;
  }

  public async histogram(params: HistogramParameters) {
    const { column, bins, start, end, bbox } = params;
    const dataviewName = this.getDataviewName();

    const layergroup = await this._createMapWithDataviews(dataviewName, 'histogram', {
      bins,
      start,
      end,
      column
    });

    return this._mapClient.dataview(layergroup, { column, bins, start, end, bbox });
  }

  public setSource(source: string) {
    if (this._source !== source) {
      this._source = source;
      this._layergroupCache = {};
    }
  }

  private async _createMapWithDataviews(
    dataviewName: string,
    type: string,
    options: Partial<MapDataviewsOptions>
  ) {
    const layergroupCacheKey = `type_${JSON.stringify(options)}`;

    if (this._layergroupCache[layergroupCacheKey]) {
      return this._layergroupCache[layergroupCacheKey];
    }

    const sourceMapConfig = MapsApiClient.generateMapConfigFromSource(this._source);
    const sourceId = sourceMapConfig.analyses[0].id;
    const mapConfig = {
      ...sourceMapConfig,
      dataviews: {
        [dataviewName]: {
          type,
          source: { id: sourceId },
          options
        }
      }
    };

    const response = await this._mapClient.instantiateMap(mapConfig);
    this._layergroupCache[layergroupCacheKey] = response;
    return response;
  }

  private getDataviewName(): string {
    const uuid = uuidv4();
    let dataviewName = this._source;

    if (dataviewName.search(' ') > -1) {
      dataviewName = 'dataview';
    }

    dataviewName = `${dataviewName}_${uuid}`;

    return dataviewName;
  }
}

export interface AggregationResponse {
  count: number;
  max: number;
  min: number;
  nulls: number;
  nans: number;
  infinities: number;
  aggregation: AggregationType;
  categoriesCount: number;
  categories: AggregationCategory[];
  // eslint-disable-next-line camelcase
  errors_with_context?: { type: string; message: string }[];
  errors?: string[];
}

export interface FormulaResponse {
  operation: string;
  result: number;
  nulls: number;
  type: string;
  // eslint-disable-next-line camelcase
  errors_with_context?: { type: string; message: string }[];
  errors?: string[];
}

export interface AggregationCategory {
  agg: boolean;
  category: string;
  value: number;
}

interface FormulaParameters {
  /**
   * column name to aggregate by
   */
  column: string;

  /**
   * operation to perform
   */
  operation: AggregationType;

  /**
   * Bbox of the data
   */
  bbox?: number[];
}

interface HistogramParameters {
  /**
   * The column name to get the data
   */
  column: string;

  /**
   * Number of bins to aggregate the data range into
   */
  bins: number;

  /**
   * Lower limit of the data range, if not present, the lower limit of the actual data will be used.
   */
  start?: number;

  /**
   * Upper limit of the data range, if not present, the upper limit of the actual data will be used.
   */
  end?: number;

  /**
   * Bounding box to filter data
   */
  bbox?: number[];
}
