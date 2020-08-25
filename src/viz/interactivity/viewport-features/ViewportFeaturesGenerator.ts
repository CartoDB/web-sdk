import { Deck, Viewport, WebMercatorViewport } from '@deck.gl/core';
import { MVTLayer } from '@deck.gl/geo-layers';
import { Matrix4 } from '@math.gl/core';
import { GeoJSON, Feature } from 'geojson';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import { SourceError } from '@/viz/errors/source-error';
import { selectPropertiesFrom } from '../../utils/object';
import { ViewportTile } from '../../declarations/deckgl';
import { GeometryData, ViewportFrustumPlanes } from './geometry/types';
import { checkIfGeometryIsInsideFrustum } from './geometry/check';
import {
  getTransformationMatrixFromTile,
  transformGeometryCoordinatesToCommonSpaceByMatrix,
  transformGeometryCoordinatesToCommonSpaceByViewport
} from './geometry/transform';

const DEFAULT_OPTIONS = {
  uniqueIdProperty: 'cartodb_id'
};

const FALLBACK_ID_PROPERTY = 'id';

/**
 * Class to obtain features from the current viewport.
 * It works with MVTLayer and GeoJson layer.
 *
 * It allows declaring the properties included in the returned features, and also to
 * specify a uniqueIdProperty for a MVTLayer (if not included, it will assume default: cartodb_id || id, in that order).
 *
 * @export
 * @class ViewportFeaturesGenerator
 */
export class ViewportFeaturesGenerator {
  // #region Private props
  private _deckInstance: Deck | undefined;
  private _deckLayer: MVTLayer<string> | GeoJsonLayer<GeoJSON> | undefined;
  private _uniqueIdProperty: string;
  private _viewport: WebMercatorViewport | undefined;
  // #endregion

  // #region Public methods
  constructor(
    deckInstance?: Deck,
    deckLayer?: MVTLayer<string> | GeoJsonLayer<GeoJSON>,
    options: ViewportFeaturesGeneratorOptions = DEFAULT_OPTIONS
  ) {
    const { uniqueIdProperty = DEFAULT_OPTIONS.uniqueIdProperty } = options;

    this._deckInstance = deckInstance;
    this._deckLayer = deckLayer;
    this._uniqueIdProperty = uniqueIdProperty;
  }

  /**
   * Check if features can be returned
   *
   * @returns {boolean}
   * @memberof ViewportFeaturesGenerator
   */
  public isReady(): boolean {
    return Boolean(this._deckInstance) && Boolean(this._deckLayer);
  }

  /**
   * Set proper deck instance
   *
   * @param {Deck} deckInstance
   * @memberof ViewportFeaturesGenerator
   */
  public setDeckInstance(deckInstance: Deck) {
    this._deckInstance = deckInstance;
  }

  /**
   * Set layer to get features from
   *
   * @param {MVTLayer<string>} deckLayer
   * @memberof ViewportFeaturesGenerator
   */
  public setDeckLayer(deckLayer: MVTLayer<string>) {
    this._deckLayer = deckLayer;
  }

  /**
   * Set options (uniqueIdProperty).
   *
   * uniqueIdProperty determines what 'pieces' in tiles are treated as 'the same' or
   * as different fefatures
   *
   * @param {ViewportFeaturesGeneratorOptions} [options=DEFAULT_OPTIONS]
   * @memberof ViewportFeaturesGenerator
   */
  public setOptions(options: ViewportFeaturesGeneratorOptions = DEFAULT_OPTIONS) {
    const { uniqueIdProperty = DEFAULT_OPTIONS.uniqueIdProperty } = options;

    this._uniqueIdProperty = uniqueIdProperty;
  }

  /**
   * Set viewport
   *
   * @param {WebMercatorViewport} viewport
   * @memberof ViewportFeaturesGenerator
   */
  public setViewport(viewport: WebMercatorViewport) {
    this._viewport = viewport;
  }

  /**
   * Get the features on the viewport
   *
   * @param {string[]} [properties=[]] name of the columns to keep on features
   * @returns {Promise<Record<string, unknown>[]>}
   * @memberof ViewportFeaturesGenerator
   */
  async getFeatures(properties: string[] = []): Promise<Record<string, unknown>[]> {
    if (this._deckLayer instanceof GeoJsonLayer || this._deckLayer instanceof IconLayer) {
      return this.getGeoJSONLayerFeatures(properties);
    }

    return this.getMVTLayerFeatures(properties);
  }

  // #endregion

  // #region Private methods

  /**
   * Get the WebMercatorViewport for spatial filtering
   */
  private getViewport() {
    if (this._viewport) {
      return this._viewport;
    }

    // WebMercatorViewport is there by default
    const viewports: Viewport[] = this._deckInstance?.getViewports(undefined);
    return viewports[0];
  }

  /**
   * Get features (from a MVTLayer)
   */
  private async getMVTLayerFeatures(properties: string[] = []) {
    const selectedTiles = await this.getSelectedTiles();
    const allTilesLoaded = selectedTiles.every(tile => tile.isLoaded);

    if (!allTilesLoaded) {
      await Promise.all(selectedTiles.map(tile => tile.data));
    }

    return this.getMVTViewportFilteredFeatures(selectedTiles, properties);
  }

  // #region MVTLayer
  private getSelectedTiles(): ViewportTile[] {
    if (!this._deckLayer || !this._deckLayer.state) {
      return [];
    }

    return this._deckLayer.state.tileset.selectedTiles;
  }

  private getMVTViewportFilteredFeatures(selectedTiles: ViewportTile[], properties: string[]) {
    const currentFrustumPlanes = this.getViewport().getFrustumPlanes();
    const featureCache = new Set<string>(); // don't assume just number (the most common use case, eg cartodb_id)

    return selectedTiles
      .map(tile => {
        const transformationMatrix = getTransformationMatrixFromTile(tile);
        const features = tile.content || [];

        const featuresWithinViewport = features.filter(feature => {
          return this.isInsideViewport(feature, {
            featureCache,
            transformationMatrix,
            currentFrustumPlanes
          });
        });

        return featuresWithinViewport.map(feature =>
          selectPropertiesFrom(feature.properties as Record<string, unknown>, properties)
        );
      })
      .flat();
  }

  private isInsideViewport(feature: GeoJSON.Feature, options: InsideViewportCheckOptions) {
    const { featureCache, transformationMatrix, currentFrustumPlanes } = options;

    if (!feature.properties) {
      return false;
    }

    const featureId: string = this.getFeatureId(feature);

    if (featureCache.has(featureId)) {
      // Prevent checking feature across tiles
      // that are already visible
      return false;
    }

    const isInside = checkIfGeometryIsInsideFrustum(
      transformGeometryCoordinatesToCommonSpaceByMatrix(
        feature.geometry as GeometryData,
        transformationMatrix
      ),
      currentFrustumPlanes
    );

    if (isInside) {
      featureCache.add(featureId);
    }

    return isInside;
  }

  private getFeatureId(feature: GeoJSON.Feature): string {
    if (!feature.properties) {
      throw new SourceError(`The feature has no properties: ${feature}`);
    }

    let id = feature.properties[this._uniqueIdProperty] || feature[FALLBACK_ID_PROPERTY];

    if (typeof id === 'number') {
      id = id.toString(); // it should be safe to assume an integer here as key...
    }

    if (typeof id !== 'string') {
      throw new SourceError(
        `Just an Integer or a String value is allowed for the id field in the feature (found: ${id})`
      );
    }

    return id;
  }

  // #endregion

  /**
   * Get features (from a GeoJson layer)
   */
  private async getGeoJSONLayerFeatures(properties: string[] = []) {
    const features = this.getGeoJSONFeatures();
    let viewport: Viewport;

    try {
      viewport = this.getViewport();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Viewport not ready');
      return [];
    }

    const currentFrustumPlanes = viewport.getFrustumPlanes();

    return features
      .filter(feature => {
        if (!feature.properties) {
          return false;
        }

        return checkIfGeometryIsInsideFrustum(
          transformGeometryCoordinatesToCommonSpaceByViewport(
            feature.geometry as GeometryData,
            viewport
          ),
          currentFrustumPlanes
        );
      })
      .map(feature => {
        return selectPropertiesFrom(feature.properties as Record<string, unknown>, properties);
      })
      .flat();
  }

  // #region GeoJson Layer
  private getGeoJSONFeatures(): Feature[] {
    if (!this._deckLayer || !this._deckLayer.props || !this._deckLayer.props.data) {
      return [];
    }

    return (this._deckLayer.props.data as unknown) as Feature[];
  }

  // #endregion

  // #endregion
}

// #region Private complements
interface ViewportFeaturesGeneratorOptions {
  uniqueIdProperty?: string;
}

interface InsideViewportCheckOptions {
  featureCache: Set<string>;
  transformationMatrix: Matrix4;
  currentFrustumPlanes: ViewportFrustumPlanes;
}

// #endregion
