import { Credentials, defaultCredentials } from '@/auth';
import { MapInstance, MapOptions, Client } from '@/maps/Client';
import { uuidv4 } from '@/core/utils/uuid';
import {
  Source,
  SourceProps,
  SourceMetadata,
  NumericFieldStats,
  CategoryFieldStats
} from './Source';
import { parseGeometryType } from '../style/helpers/utils';
import { sourceErrorTypes, SourceError } from '../errors/source-error';

export interface SourceOptions {
  credentials?: Credentials;
  mapOptions?: MapOptions;
}

const DEFAULT_ID_PROPERTY = 'cartodb_id';

export const defaultMapOptions: MapOptions = {
  vectorExtent: 2048,
  vectorSimplifyExtent: 2048,
  bufferSize: {
    mvt: 10
  },
  metadata: {
    geometryType: true,
    columnStats: {
      topCategories: 32768,
      includeNulls: true
    },
    dimensions: true,
    sample: {
      num_rows: 1000,
      include_columns: []
    }
  },
  aggregation: {
    columns: {},
    dimensions: {},
    placement: 'centroid',
    resolution: 1,
    threshold: 1
  }
};

interface SQLSourceProps extends SourceProps {
  // Tile URL template. It should be in the format of https://server/{z}/{x}/{y}..
  data: string | Array<string>;
}

/**
 * Implementation of a Source compatible with CARTO's MAPs API
 * * */
export class SQLSource extends Source {
  // value it should be a dataset name or a SQL query
  protected _value: string;
  // Internal credentials of the user
  protected _credentials: Credentials;
  protected _props?: SQLSourceProps;
  protected _mapConfig: MapOptions;
  protected _metadata?: SourceMetadata;

  constructor(sql: string, options: SourceOptions = {}) {
    const { mapOptions = defaultMapOptions, credentials = defaultCredentials } = options;

    // set layer id
    const id = `CARTO-SQL-${uuidv4()}`;

    // call to super class
    super(id);
    this.sourceType = 'SQLSource';

    // Set object properties
    this._value = sql;
    this._credentials = credentials;
    this._mapConfig = this.buildMapConfig(mapOptions);
  }

  /**
   * It returns the props of the source:
   *   - URL of the tiles provided by MAPs API
   *   - geometryType
   */
  public getProps(): SQLSourceProps {
    if (this.needsInitialization) {
      throw new SourceError('getProps requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    if (this._props === undefined) {
      throw new SourceError('Props are not set after map instantiation');
    }

    return this._props;
  }

  public get value(): string {
    return this._value;
  }

  public get credentials(): Credentials {
    return this._credentials;
  }

  public getMetadata(): SourceMetadata {
    // initialize the stats to 0

    if (this.needsInitialization) {
      throw new SourceError('GetMetadata requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    if (this._metadata === undefined) {
      throw new SourceError('Metadata are not set after map instantiation');
    }

    return this._metadata;
  }

  /**
   * Instantiate the map, getting proper stats for input fields
   */
  public async init(): Promise<boolean> {
    if (!this.needsInitialization) {
      return true;
    }

    this.needsInitialization = false;

    const mapsClient = new Client(this._credentials);
    const mapInstance: MapInstance = await mapsClient.instantiateMapFrom(this.getMapConfig());

    const urlTemplate = getUrlsFrom(mapInstance);
    this._props = { type: 'TileLayer', data: urlTemplate }; // TODO refactor / include in metadata ?
    this._metadata = this.extractMetadataFrom(mapInstance);

    return true;
  }

  private buildMapConfig(mapOptions: MapOptions) {
    const defaultMapOptionsCopy = JSON.parse(JSON.stringify(defaultMapOptions));

    return {
      ...defaultMapOptionsCopy,
      ...mapOptions,
      metadata: {
        ...defaultMapOptionsCopy.metadata,
        ...mapOptions.metadata
      },
      aggregation: {
        ...defaultMapOptionsCopy.aggregation,
        ...mapOptions.aggregation
      },
      sql: this._value
    };
  }

  private getMapConfig() {
    this.updateMapConfigMetadata();
    this.updateMapConfigAggregation();
    return this._mapConfig;
  }

  private updateMapConfigMetadata() {
    if (!this._mapConfig.metadata) {
      throw new SourceError('Map Config has not metadata field');
    }

    if (!this._mapConfig.metadata.sample) {
      this._mapConfig.metadata.sample = {
        num_rows: 1000,
        include_columns: []
      };
    }

    const includeColumns = new Set([
      ...this._mapConfig.metadata.sample.include_columns,
      ...this.fields
    ]);
    this._mapConfig.metadata.sample.include_columns = [...includeColumns];
  }

  private updateMapConfigAggregation() {
    if (this.fields.size) {
      if (!this._mapConfig.aggregation) {
        throw new SourceError('Map Config has not aggregation field');
      }

      if (!this._mapConfig.aggregation.dimensions) {
        this._mapConfig.aggregation.dimensions = {};
      }

      const { dimensions } = this._mapConfig.aggregation;
      this.fields.forEach(field => {
        if (field !== DEFAULT_ID_PROPERTY) {
          dimensions[field] = { column: field };
        }
      });

      this._mapConfig.aggregation.dimensions = { ...dimensions };
    }
  }

  private extractMetadataFrom(mapInstance: MapInstance) {
    const { stats } = mapInstance.metadata.layers[0].meta;
    const geometryType = parseGeometryType(stats.geometryType);
    const fieldStats = this.getCompleteFieldStats(stats);

    const metadata = { geometryType, stats: fieldStats };

    return metadata;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getCompleteFieldStats(stats: any) {
    if (!this.fields.size) {
      return [];
    }

    const fieldStats: (NumericFieldStats | CategoryFieldStats)[] = [];

    this.fields.forEach(column => {
      const columnStats = stats.columns[column];

      if (!columnStats) {
        throw new SourceError(`Column '${column}' does not exist in '${this._value}'`);
      }

      switch (columnStats.type) {
        case 'string':
          fieldStats.push({
            name: column,
            categories: columnStats.categories
          });
          break;
        case 'number':
          fieldStats.push({
            name: column,
            ...stats.columns[column],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sample: stats.sample.map((x: any) => x[column])
          });
          break;
        default:
          throw new SourceError(
            'Unsupported type for stats',
            sourceErrorTypes.UNSUPPORTED_STATS_TYPE
          );
      }
    });

    return fieldStats;
  }
}

function getUrlsFrom(mapInstance: MapInstance): string | string[] {
  const urlData = mapInstance.metadata.url.vector;
  let urlTemplate = [urlData.urlTemplate];

  // if subdomains exist, then a collection of urls will be used for better performance
  if (urlData.subdomains.length) {
    urlTemplate = urlData.subdomains.map((subdomain: string) =>
      urlData.urlTemplate.replace('{s}', subdomain)
    );
  }

  return urlTemplate;
}
