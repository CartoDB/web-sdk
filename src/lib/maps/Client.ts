import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { uuidv4 } from '@/core/utils/uuid';
import { Credentials } from '../auth';
import errorHandlers from './errors';
import { encodeParameter, getRequest, postRequest } from './utils';

const REQUEST_GET_MAX_URL_LENGTH = 2048;
const VECTOR_EXTENT = 2048;
const VECTOR_SIMPLIFY_EXTENT = 2048;

export class Client {
  private _credentials: Credentials;

  constructor(credentials: Credentials) {
    this._credentials = credentials;
  }

  /**
   * Instantiate a map based on dataset name or a sql query, returning a layergroup
   *
   * @param options
   */
  public async instantiateMapFrom(options: MapOptions) {
    const {
      sql,
      dataset,
      vectorExtent = VECTOR_EXTENT,
      vectorSimplifyExtent = VECTOR_SIMPLIFY_EXTENT,
      metadata = {},
      aggregation = {},
      bufferSize
    } = options;

    if (!(sql || dataset)) {
      throw new Error('Please provide a dataset or a SQL query');
    }

    const mapConfig = {
      version: '1.3.1',
      buffersize: bufferSize,
      layers: [
        {
          type: 'mapnik',
          options: {
            sql: sql || `select * from ${dataset}`,
            vector_extent: vectorExtent,
            vector_simplify_extent: vectorSimplifyExtent,
            metadata,
            aggregation
          }
        }
      ]
    };

    return this.instantiateMap(mapConfig);
  }

  public static generateMapConfigFromSource(source: string) {
    const uuid = uuidv4();
    const type = source.search(' ') > -1 ? 'sql' : 'dataset';

    return {
      [type]: source,
      vectorExtent: VECTOR_EXTENT,
      vectorSimplifyExtent: VECTOR_SIMPLIFY_EXTENT,
      analyses: [
        {
          type: 'source',
          id: `${source}_${uuid}`,
          params: {
            query: type === 'sql' ? source : `SELECT * FROM ${source}`
          }
        }
      ],
      layers: []
    };
  }

  /**
   *
   * @param layergroup
   * @param options
   */
  public async dataview(
    layergroup: MapInstance,
    dataview: string,
    dataViewOptions?: Partial<MapDataviewsOptions>
  ) {
    const {
      metadata: {
        dataviews: {
          [dataview]: { url }
        }
      }
    } = layergroup;

    const params = {
      api_key: this._credentials.apiKey,
      ...dataViewOptions
    };

    const definedParams = Object.fromEntries(Object.entries(params).filter(([, v]) => !!v));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const urlSearchParams = new URLSearchParams(definedParams);
    const getUrl = `${url.https}?${urlSearchParams.toString()}`;
    const response = await fetch(getRequest(getUrl));
    const dataviewResponse = await response.json();

    return dataviewResponse;
  }

  public async instantiateMap(mapConfig: unknown) {
    let response;

    try {
      const payload = JSON.stringify(mapConfig);
      response = await fetch(this.makeMapsApiRequest(payload));
    } catch (error) {
      throw new Error(
        `Failed to connect to Maps API with the user ('${this._credentials.username}'): ${error}`
      );
    }

    const layergroup = (await response.json()) as never;

    if (!response.ok) {
      this.dealWithWindshaftErrors(response, layergroup);
    }

    return layergroup;
  }

  private makeMapsApiRequest(config: string) {
    const encodedApiKey = encodeParameter('api_key', this._credentials.apiKey);
    const parameters = [encodedApiKey];
    const url = this.generateMapsApiUrl(parameters);

    const getUrl = `${url}&${encodeParameter('config', config)}`;

    if (getUrl.length < REQUEST_GET_MAX_URL_LENGTH) {
      return getRequest(getUrl);
    }

    return postRequest(url, config);
  }

  private dealWithWindshaftErrors(
    response: { status: number },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layergroup: any
  ) {
    const errorForCode = errorHandlers[response.status];

    if (errorForCode) {
      errorForCode(this._credentials);
      return;
    }

    throw new Error(`${JSON.stringify(layergroup.errors)}`);
  }

  private generateMapsApiUrl(parameters: string[] = []) {
    const base = `${this._credentials.serverURL}api/v1/map`;
    return `${base}?${parameters.join('&')}`;
  }
}

export interface AggregationColumn {
  // eslint-disable-next-line camelcase
  aggregate_function: string;
  // eslint-disable-next-line camelcase
  aggregated_column: string;
}

export interface StatsColumn {
  topCategories: number;
  includeNulls: boolean;
}

export interface Sample {
  // eslint-disable-next-line camelcase
  num_rows: number;
  // eslint-disable-next-line camelcase
  include_columns: string[];
}

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

interface BufferSizeOptions {
  png?: number;
  'grid.json'?: number;
  mvt?: number;
}

export interface MapInstance {
  layergroupid: string;
  // eslint-disable-next-line camelcase
  last_updated: string;
  metadata: {
    layers: [
      {
        type: string;
        id: string;
        meta: {
          stats: {
            estimatedFeatureCount: number;
            geometryType: string;
            // TODO: create a proper type for columns
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns: any;
            sample: number[];
          };
          aggregation: {
            png: boolean;
            mvt: boolean;
          };
        };
        tilejson: {
          vector: {
            tilejson: string;
            tiles: string[];
          };
        };
      }
    ];
    dataviews: {
      [dataview: string]: {
        url: {
          http: string;
          https: string;
        };
      };
    };
    tilejson: {
      vector: {
        tilejson: string;
        tiles: string[];
      };
    };
    url: {
      vector: {
        urlTemplate: string;
        subdomains: string[];
      };
    };
  };
  // eslint-disable-next-line camelcase
  cdn_url: {
    http: string;
    https: string;
    templates: {
      http: {
        subdomains: string[];
        url: string;
      };
      https: {
        subdomains: string[];
        url: string;
      };
    };
  };
}

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
