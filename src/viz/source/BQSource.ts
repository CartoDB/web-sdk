/* eslint-disable class-methods-use-this */

import { uuidv4 } from '@/core/utils/uuid';
import { TileJsonInstance, TileJsonClient } from '@/tilejson';
import { sourceErrorTypes, SourceError } from '@/viz/errors/source-error';
import { TileStatsLayerAttribute } from '@/tilejson/TileJsonInstance';
import {
  Source,
  SourceProps,
  SourceMetadata,
  NumericFieldStats,
  CategoryFieldStats
} from './Source';
import { parseGeometryType } from '../style/helpers/utils';

interface BQSourceProps extends SourceProps {
  // Tile URL template. It should be in the format of https://server/{z}/{x}/{y}..
  data: string | Array<string>;
}

// https://bq1.cartocdn.com/tilesjson?t={project}.{dataset}.{tileset_table_name}
const DEFAULT_TILEJSON_ENDPOINT = 'https://bq1.cartocdn.com/tilesjson';

interface BQSourceOptions {
  tileJsonEndpoint: string;
}

export class BQSource extends Source {
  // #region Private props
  private _dataset: string;
  private _tileJsonEndpoint: string;
  private _props?: BQSourceProps;
  private _metadata?: SourceMetadata;

  // #endregion

  // #region Public methods
  constructor(
    dataset: string,
    options: BQSourceOptions = { tileJsonEndpoint: DEFAULT_TILEJSON_ENDPOINT }
  ) {
    super(`CARTOBQ-${uuidv4()}`);
    this.sourceType = 'BQ';

    this._dataset = dataset;

    const { tileJsonEndpoint } = options;
    this._tileJsonEndpoint = tileJsonEndpoint;
  }

  /**
   * Instantiate the map, getting proper stats for input fields
   */
  public async init(): Promise<boolean> {
    if (!this.needsInitialization) {
      return true;
    }

    this.needsInitialization = false;
    // https://bq1.cartocdn.com/tilesjson?t={project}.{dataset}.{tileset_table_name}
    // right now dataset = '{project}.{dataset}.{tileset_table_name}'
    const url = `${this._tileJsonEndpoint}?t=${this._dataset}`;
    const tilejsonClient = new TileJsonClient();
    const tilejsonInstance: TileJsonInstance = await tilejsonClient.getTilesetInfoFrom(url);

    const urlTemplate = tilejsonInstance.tiles;
    this._props = { type: 'TileLayer', data: urlTemplate };

    this._metadata = this._extractMetadataFrom(tilejsonInstance);

    return true;
  }

  public isEmpty() {
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  public getFeatures(): Record<string, unknown>[] {
    throw new Error(`Method not implemented`);
  }

  /**
   * Returns the metadata of the source, if it has been initialized.
   * It throws an error otherwise
   *
   * @returns {SourceMetadata}
   * @memberof BQSource
   */
  public getMetadata(): SourceMetadata {
    if (this.needsInitialization) {
      throw new SourceError('GetMetadata requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    if (this._metadata === undefined) {
      throw new SourceError('Metadata was not set after request to tilejson info');
    }

    return this._metadata;
  }

  /**
   * It returns the props of the source:
   *   - URL of the tiles provided by BQ TilesJson file
   *   - geometryType
   */

  /**
   * It returns the props of the source
   *
   * @returns {BQSourceProps}
   * @memberof BQSource
   */
  public getProps(): BQSourceProps {
    if (this.needsInitialization) {
      throw new SourceError('getProps requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    if (this._props === undefined) {
      throw new SourceError('Props are not set after map instantiation');
    }

    return this._props;
  }

  // #endregion

  // #region Private methods

  /**
   * General metadata parsing from tilejson endpoint response
   */
  private _extractMetadataFrom(tilejson: TileJsonInstance) {
    console.error(`METADATA FOR BQSOURCE NOT IMPLEMENTED YET`);

    if (!tilejson.vector_layers || !tilejson.tilestats) {
      throw new SourceError('BQ Source does not provide required "vector_layers" or "tilestats"');
    }

    // assuming just 1 layer
    const layer = tilejson.vector_layers[0];
    const geometryType = parseGeometryType(layer.geometry_type);
    Object.keys(layer.fields).forEach(field => this.fields.add(field)); // all metadata available upfront

    const fieldStats = this._getCompleteFieldStats(tilejson.tilestats.layers[0].attributes);

    const metadata = { geometryType, stats: fieldStats };
    return metadata;
  }

  private _getCompleteFieldStats(attributes: TileStatsLayerAttribute[]) {
    if (!this.fields.size) {
      return [];
    }

    const fieldStats: (NumericFieldStats | CategoryFieldStats)[] = [];

    this.fields.forEach(column => {
      const columnStats = attributes.filter(attr => {
        return attr.attribute === column;
      })[0];

      switch (columnStats.type) {
        case 'Number':
          fieldStats.push({
            name: column,
            min: columnStats.min,
            max: columnStats.max,
            avg: columnStats.avg,
            sum: columnStats.sum,
            sample: columnStats.sample
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
  // #endregion
}
