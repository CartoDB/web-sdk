import { Credentials } from '../core/Credentials';
import { Client, AggregationType, MapDataviewsOptions } from './Client';

export class MapsDataviews {
  private _source: string;
  private _mapClient: Client;

  constructor(source: string, credentials: Credentials) {
    this._source = source;
    this._mapClient = new Client(credentials);
  }

  public async aggregation(params: Partial<MapDataviewsOptions>): Promise<AggregationResponse> {
    const { column, aggregation, aggregationColumn, limit, bbox } = params;
    const dataviewName = `${this._source}_${Date.now()}`;

    const layergroup = await this._createMapWithDataviews(dataviewName, 'aggregation', {
      column,
      aggregation,
      aggregationColumn,
      bbox
    });

    const aggregationResponse = this._mapClient.dataview(layergroup, dataviewName, { limit });

    return (aggregationResponse as unknown) as AggregationResponse;
  }

  public async formula(params: FormulaParameters) {
    const { column, operation, bbox } = params;

    const dataviewName = `${this._source}_${Date.now()}`;
    const layergroup = await this._createMapWithDataviews(dataviewName, 'formula', {
      operation,
      column
    });

    const formulaResponse = this._mapClient.dataview(layergroup, dataviewName, { bbox });

    return (formulaResponse as unknown) as FormulaResponse;
  }

  private _createMapWithDataviews(
    dataviewName: string,
    type: string,
    options: Partial<MapDataviewsOptions>
  ) {
    const sourceMapConfig = Client.generateMapConfigFromSource(this._source);
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

    const response = this._mapClient.instantiateMap(mapConfig);
    return response;
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
