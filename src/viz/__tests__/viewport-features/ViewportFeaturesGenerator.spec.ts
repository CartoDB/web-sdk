import { Deck, WebMercatorViewport } from '@deck.gl/core';
import { MVTLayer } from '@deck.gl/geo-layers';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GeoJSON } from 'geojson';

import { ViewportFeaturesGenerator } from '@/viz/interactivity/viewport-features/ViewportFeaturesGenerator';
import * as geojsonContinentPoints from './cases/geojson/continentPoints.json';
import {
  createDeckInstance,
  createFakeDeckGlInstance,
  createFakeLayerWithSelectedTiles,
  createViewport
} from './cases/utils';

// Test Cases
import { testCases } from './cases';

describe('ViewportFeaturesGenerator', () => {
  describe('Instance Creation', () => {
    it('should create new ViewportFeaturesGenerator instance', () => {
      const layerInstance = new MVTLayer<string>({});
      const deckInstance = createDeckInstance({
        layers: [layerInstance as any]
      });

      expect(() => new ViewportFeaturesGenerator(deckInstance, layerInstance)).not.toThrow();
    });

    it('should create new ViewportFeaturesGenerator instance without arguments', () => {
      expect(() => new ViewportFeaturesGenerator()).not.toThrow();
    });
  });

  describe('isReady', () => {
    it('should return false if deckInstance is not present', () => {
      const vfGenerator = new ViewportFeaturesGenerator(undefined, new MVTLayer<string>({}));
      expect(vfGenerator.isReady()).toBe(false);
    });

    it('should return false if deckLayer is not present', () => {
      const deckInstance = createDeckInstance();
      const vfGenerator = new ViewportFeaturesGenerator(deckInstance, undefined);
      expect(vfGenerator.isReady()).toBe(false);
    });

    it('should return true if deckInstance and deckLayer are present', () => {
      const deckInstance = createDeckInstance();
      const vfGenerator = new ViewportFeaturesGenerator(deckInstance, new MVTLayer<string>({}));
      expect(vfGenerator.isReady()).toBe(true);
    });
  });

  describe('getFeatures (MVT)', () => {
    it.each(testCases)('%# default (cartodb_id)', async testCase => {
      const mvtLayer = createFakeLayerWithSelectedTiles(testCase.tiles as any) as MVTLayer<string>;

      const deckInstance = createFakeDeckGlInstance({
        viewports: [
          createViewport({
            frustumPlanes: testCase.frustumPlanes
          })
        ]
      }) as unknown;

      const vfGenerator = new ViewportFeaturesGenerator(deckInstance as Deck, mvtLayer);

      const viewportFeatures = await vfGenerator.getFeatures(testCase.viewportFeaturesColumns);
      expect(viewportFeatures).toEqual(testCase.viewportFeaturesResult);
      expect(viewportFeatures.length).toEqual(testCase.viewportFeaturesCount);
    });

    it.each(testCases)('%# (custom_id)', async testCase => {
      const mvtLayer = createFakeLayerWithSelectedTiles(testCase.tiles as any) as MVTLayer<string>;

      const deckInstance = createFakeDeckGlInstance({
        viewports: [createViewport({ frustumPlanes: testCase.frustumPlanes })]
      }) as unknown;

      const vfGenerator = new ViewportFeaturesGenerator(deckInstance as Deck, mvtLayer, {
        uniqueIdProperty: 'custom_id'
      });

      const viewportFeatures = await vfGenerator.getFeatures(testCase.viewportFeaturesColumns);
      // console.log(viewportFeatures);
      expect(viewportFeatures.length).toEqual(testCase.viewportFeaturesCountWithCustomId);
    });
  });

  describe('getFeatures (GeoJSON)', () => {
    const worldViewport = new WebMercatorViewport({
      latitude: 0,
      longitude: 0,
      zoom: 1,
      width: 800,
      height: 700
    });
    it('should return all features for the whole extent (full world viewport) -no custom id-', async () => {
      const deckInstance = createFakeDeckGlInstance({
        viewports: [worldViewport]
      }) as unknown;

      const geojsonLayer = new GeoJsonLayer({ data: geojsonContinentPoints.features }) as unknown;

      const vfGenerator = new ViewportFeaturesGenerator(
        deckInstance as Deck,
        geojsonLayer as GeoJsonLayer<GeoJSON>
      );

      const viewportFeatures = await vfGenerator.getFeatures(['name']);
      expect(viewportFeatures.length).toEqual(6);
    });

    it('should return all features when using custom id', async () => {
      const deckInstance = createFakeDeckGlInstance({
        viewports: [worldViewport]
      }) as unknown;

      const geojsonLayer = new GeoJsonLayer({
        data: geojsonContinentPoints.features
      }) as unknown;

      const vfGenerator = new ViewportFeaturesGenerator(
        deckInstance as Deck,
        geojsonLayer as GeoJsonLayer<GeoJSON>,
        { uniqueIdProperty: 'customId' }
      );

      const viewportFeatures = await vfGenerator.getFeatures(['name']);
      // console.log(viewportFeatures);
      expect(viewportFeatures.length).toEqual(6);
    });
  });
});
