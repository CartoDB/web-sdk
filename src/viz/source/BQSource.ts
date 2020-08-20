/* eslint-disable class-methods-use-this */

import { uuidv4 } from '@/core/utils/uuid';
import { TileJsonInstance, TileJsonClient } from '@/tilejson';
import { sourceErrorTypes, SourceError } from '@/viz/errors/source-error';
import { Source, SourceProps, SourceMetadata, GeometryType } from './Source';
import { parseGeometryType } from '../style/helpers/utils';

interface BQSourceProps extends SourceProps {
  // Tile URL template. It should be in the format of https://server/{z}/{x}/{y}..
  data: string | Array<string>;
}

// https://bq1.cartocdn.com/tilesjson?t={project}.{dataset}.{tileset_table_name}
const baseURL = 'https://bq1.cartocdn.com/tilesjson';

export class BQSource extends Source {
  // _dataset it should be a valid dataset name for a BQ tileset
  protected _dataset: string;
  protected _props?: BQSourceProps;
  protected _metadata?: SourceMetadata;

  // constructor(dataset: string, options: SourceOptions = {}) {
  constructor(dataset: string) {
    super(`CARTOBQ-${uuidv4()}`);
    this.sourceType = 'BQSource';

    this._dataset = dataset;
  }

  // #region Public
  /**
   * Instantiate the map, getting proper stats for input fields
   */
  public async init(): Promise<boolean> {
    if (!this.needsInitialization) {
      return true;
    }

    this.needsInitialization = false;
    // https://bq1.cartocdn.com/tilesjson?t={project}.{dataset}.{tileset_table_name}
    const url = `${baseURL}?t=${this._dataset}`;
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

  // #endregion Public

  // #region Private
  private _extractMetadataFrom(tilejson: TileJsonInstance) {
    console.error(`METADATA FOR BQSOURCE NOT IMPLEMENTED YET`);

    let geometryType: GeometryType | undefined;

    if (tilejson.vector_layers) {
      geometryType = parseGeometryType(tilejson.vector_layers[0].geometry_type);
    }

    const metadata = { geometryType, stats: [] };
    return metadata;
  }
  // #endregion Private
}
