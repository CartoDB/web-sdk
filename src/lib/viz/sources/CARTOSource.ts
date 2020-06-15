import { Credentials, defaultCredentials } from '@/core/Credentials';
import { MapInstance, MapOptions, Client } from '@/maps/Client';
import {
  Source,
  SourceProps,
  SourceMetadata,
  NumericFieldStats,
  CategoryFieldStats,
  Field
} from './Source';
import { parseGeometryType } from '../style/helpers/utils';
import { sourceErrorTypes, SourceError } from '../errors/source-error';

export interface SourceOptions {
  credentials?: Credentials;
  mapOptions?: MapOptions;
}

const defaultMapOptions: MapOptions = {
  vectorExtent: 2048,
  vectorSimplifyExtent: 2048,
  bufferSize: {
    mvt: 10
  },
  metadata: {
    geometryType: true
  }
};

function getSourceType(source: string) {
  const containsSpace = source.search(' ') > -1;
  return containsSpace ? 'sql' : 'dataset';
}

interface CARTOSourceProps extends SourceProps {
  // Tile URL template. It should be in the format of https://server/{z}/{x}/{y}..
  data: string | Array<string>;
}

/**
 * Implementation of a Source compatible with CARTO's MAPs API
 * * */
export class CARTOSource extends Source {
  // type of the source.
  private _type: 'sql' | 'dataset';
  // value it should be a dataset name or a SQL query
  private _value: string;

  // Internal credentials of the user
  private _credentials: Credentials;

  private _props?: CARTOSourceProps;

  private _mapConfig: MapOptions;

  private _metadata?: SourceMetadata;

  constructor(source: string, options: SourceOptions = {}) {
    const { mapOptions = {}, credentials = defaultCredentials } = options;

    // set layer id
    const id = `CARTO-${source}`;

    // call to super class
    super(id);

    // Set object properties
    this._type = getSourceType(source);
    this._value = source;
    this._credentials = credentials;
    const sourceOpts = { [this._type]: source };

    // Set Map Config
    this._mapConfig = {
      // hack: deep copy
      ...JSON.parse(JSON.stringify(defaultMapOptions)),
      ...mapOptions,
      ...sourceOpts
    };
  }

  /**
   * It returns the props of the source:
   *   - URL of the tiles provided by MAPs API
   *   - geometryType
   */
  public getProps(): CARTOSourceProps {
    if (!this.isInitialized) {
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

  public get type(): 'sql' | 'dataset' {
    return this._type;
  }

  public get credentials(): Credentials {
    return this._credentials;
  }

  public getMetadata(): SourceMetadata {
    // initialize the stats to 0

    if (!this.isInitialized) {
      throw new SourceError('GetMetadata requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    if (this._metadata === undefined) {
      throw new SourceError('Metadata are not set after map instantiation');
    }

    return this._metadata;
  }

  // eslint-disable-next-line class-methods-use-this
  addFilter() {
    throw new Error(`Method not implemented`);
  }

  // eslint-disable-next-line class-methods-use-this
  removeFilter() {
    throw new Error(`Method not implemented`);
  }

  /**
   * Set the internal mapConfig properly: columnStats, dimensions, sample and aggregation
   * @param fields
   */
  private _initConfigForStats(fields: Field[]) {
    if (this._mapConfig.metadata === undefined) {
      throw new SourceError('Map Config has not metadata field');
    }

    // Modify mapConfig to add the field stats
    this._mapConfig.metadata.columnStats = {
      topCategories: 32768,
      includeNulls: true
    };

    this._mapConfig.metadata.dimensions = true;

    this._mapConfig.metadata.sample = {
      num_rows: 1000,
      include_columns: fields.filter(f => f.sample).map(f => f.column)
    };

    const dimensions: Record<string, { column: string }> = {};
    fields.forEach(field => {
      if (field.aggregation) {
        dimensions[field.column] = { column: field.column };
      }
    });

    this._mapConfig.aggregation = {
      columns: {},
      dimensions,
      placement: 'centroid',
      resolution: 1,
      threshold: 1
    };
  }

  /**
   * Instantiate the map, getting proper stats for input fields
   * @param fields
   */
  public async init(fields?: Field[]): Promise<boolean> {
    if (this.isInitialized) {
      // Maybe this is too hard, but I'd like to keep to check it's not a performance issue. We could move it to just a warning
      throw new SourceError('Try to reinstantiate map multiple times');
    }

    if (fields) {
      this._initConfigForStats(fields);
    }

    const mapsClient = new Client(this._credentials);
    const mapInstance: MapInstance = await mapsClient.instantiateMapFrom(this._mapConfig);

    const urlTemplate = getUrlsFrom(mapInstance);
    this._props = { type: 'TileLayer', data: urlTemplate }; // TODO refactor / include in metadata ?
    this._metadata = extractMetadataFrom(mapInstance, fields);

    this.isInitialized = true;
    return this.isInitialized;
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

function extractMetadataFrom(mapInstance: MapInstance, fields?: Field[]) {
  const { stats } = mapInstance.metadata.layers[0].meta;
  const geometryType = parseGeometryType(stats.geometryType);
  const fieldStats = getCompleteFieldStats(stats, fields);

  const metadata = { geometryType, stats: fieldStats };

  return metadata;
}

function getCompleteFieldStats(stats: any, fields?: Field[]) {
  const fieldStats: (NumericFieldStats | CategoryFieldStats)[] = [];

  if (fields) {
    fields.forEach(field => {
      const columnStats = stats.columns[field.column];

      switch (columnStats.type) {
        case 'string':
          fieldStats.push({
            name: field.column,
            categories: columnStats.categories
          });
          break;
        case 'number':
          fieldStats.push({
            name: field.column,
            ...stats.columns[field.column],
            sample: stats.sample.map((x: any) => x[field.column])
          });
          break;
        default:
          throw new SourceError(
            'Unsupported type for stats',
            sourceErrorTypes.UNSUPPORTED_STATS_TYPE
          );
      }
    });
  }

  return fieldStats;
}
