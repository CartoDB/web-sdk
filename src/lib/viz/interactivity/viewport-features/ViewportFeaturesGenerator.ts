import { Deck, Viewport, WebMercatorViewport } from '@deck.gl/core';
import { MVTLayer } from '@deck.gl/geo-layers';
import { Matrix4 } from '@math.gl/core';
import { GeoJSON } from 'geojson';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import { getFeatures } from '@/viz/source/GeoJSONSource';
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

export class ViewportFeaturesGenerator {
  private deckInstance: Deck | undefined;
  private deckLayer: MVTLayer<string> | GeoJsonLayer<GeoJSON> | undefined;
  private uniqueIdProperty: string;
  private viewport: WebMercatorViewport | undefined;

  constructor(
    deckInstance?: Deck,
    deckLayer?: MVTLayer<string> | GeoJsonLayer<GeoJSON>,
    options: ViewportFeaturesGeneratorOptions = DEFAULT_OPTIONS
  ) {
    const { uniqueIdProperty = DEFAULT_OPTIONS.uniqueIdProperty } = options;

    this.deckInstance = deckInstance;
    this.deckLayer = deckLayer;
    this.uniqueIdProperty = uniqueIdProperty;
  }

  isReady() {
    return Boolean(this.deckInstance) && Boolean(this.deckLayer);
  }

  async getFeatures(properties: string[] = []) {
    if (this.deckLayer instanceof GeoJsonLayer || this.deckLayer instanceof IconLayer) {
      return this.getGeoJSONLayerFeatures(properties);
    }

    return this.getMVTLayerFeatures(properties);
  }

  private async getMVTLayerFeatures(properties: string[] = []) {
    const selectedTiles = await this.getSelectedTiles();
    const allTilesLoaded = selectedTiles.every(tile => tile.isLoaded);

    if (!allTilesLoaded) {
      await Promise.all(selectedTiles.map(tile => tile.data));
    }

    return this.getMVTViewportFilteredFeatures(selectedTiles, properties);
  }

  private async getGeoJSONLayerFeatures(properties: string[] = []) {
    const features = this.getGeoJSONFeatures();
    const viewport = this.getViewport();
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

  private getMVTViewportFilteredFeatures(selectedTiles: ViewportTile[], properties: string[]) {
    const currentFrustumPlanes = this.getViewport().getFrustumPlanes();
    const featureCache = new Set<number>();

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

    const featureId: number = feature.properties[this.uniqueIdProperty] || feature.id;

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

  private getSelectedTiles(): ViewportTile[] {
    if (!this.deckLayer || !this.deckLayer.state) {
      return [];
    }

    return this.deckLayer.state.tileset.selectedTiles;
  }

  private getGeoJSONFeatures() {
    if (!this.deckLayer || !this.deckLayer.props || !this.deckLayer.props.data) {
      return [];
    }

    const geoJSON = (this.deckLayer.props.data as unknown) as GeoJSON;
    return getFeatures(geoJSON);
  }

  private getViewport() {
    if (this.viewport) {
      return this.viewport;
    }

    // WebMercatorViewport is there by default
    const viewports: Viewport[] = this.deckInstance?.getViewports(undefined);
    return viewports[0];
  }

  public setDeckInstance(deckInstance: Deck) {
    this.deckInstance = deckInstance;
  }

  public setDeckLayer(deckLayer: MVTLayer<string>) {
    this.deckLayer = deckLayer;
  }

  public setViewport(viewport: WebMercatorViewport) {
    this.viewport = viewport;
  }
}

interface ViewportFeaturesGeneratorOptions {
  uniqueIdProperty?: string;
}

interface InsideViewportCheckOptions {
  featureCache: Set<number>;
  transformationMatrix: Matrix4;
  currentFrustumPlanes: ViewportFrustumPlanes;
}
