import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { uuidv4 } from '@/core/utils/uuid';
import { Credentials } from '../core/Credentials';
import { Client, MapDataviewsOptions } from './Client';

export class MapsDataviews {
  private _source: string;
  private _mapClient: Client;

  constructor(source: string, credentials: Credentials) {
    this._source = source;
    this._mapClient = new Client(credentials);
  }

  public async aggregation(params: Partial<MapDataviewsOptions>): Promise<AggregationResponse> {
    const { column, aggregation, aggregationColumn, categories, bbox } = params;
    const dataviewName = this.getDataviewName();

    const layergroup = await this._createMapWithDataviews(dataviewName, 'aggregation', {
      column,
      aggregation,
      aggregationColumn
    });

    const aggregationResponse = this._mapClient.dataview(layergroup, dataviewName, {
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
