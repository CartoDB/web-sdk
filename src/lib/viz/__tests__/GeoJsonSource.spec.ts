import { Feature, FeatureCollection, Geometry, GeometryCollection } from 'geojson';
import {
  GeoJsonSource,
  getGeomType,
  getFeatures,
  DEFAULT_GEOM,
  shouldInitialize
} from '../sources/GeoJsonSource';

const GEOJSON_GEOM_TYPE = 'LineString';
const GEOM_TYPE = 'Line';

const geometry: Geometry = {
  type: GEOJSON_GEOM_TYPE,
  coordinates: [
    [1, 1],
    [2, 2]
  ]
};

const feature: Feature = {
  type: 'Feature',
  id: 1,
  geometry,
  properties: {
    number: 10,
    cat: 'cat1'
  }
};

const geometryCollection: GeometryCollection = {
  type: 'GeometryCollection',
  geometries: [geometry]
};

const featureCollection: FeatureCollection = {
  type: 'FeatureCollection',
  features: [feature, feature, feature]
};

describe('getGeomType', () => {
  it('should get geom type from FeatureCollection', () => {
    const geomType = getGeomType(featureCollection);
    expect(geomType).toEqual(GEOM_TYPE);
  });

  it('should get geom type from GeometryCollection', () => {
    const geomType = getGeomType(geometryCollection);
    expect(geomType).toEqual(GEOM_TYPE);
  });

  it('should get geom type from Feature', () => {
    const geomType = getGeomType(feature);
    expect(geomType).toEqual(GEOM_TYPE);
  });

  it('should get geom type from Geometry', () => {
    const geomType = getGeomType(geometry);
    expect(geomType).toEqual(GEOM_TYPE);
  });

  it('should return default geom type from empty FeatureCollection', () => {
    const emptyFeatureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const geomType = getGeomType(emptyFeatureCollection);
    expect(geomType).toEqual(DEFAULT_GEOM);
  });

  it('should return default geom type from empty GeometryCollection', () => {
    const emptyGeometryCollection: GeometryCollection = {
      type: 'GeometryCollection',
      geometries: []
    };

    const geomType = getGeomType(emptyGeometryCollection);
    expect(geomType).toEqual(DEFAULT_GEOM);
  });
});

describe('getFeatures', () => {
  it('should get features count from FeatureCollection', () => {
    const features = getFeatures(featureCollection);
    expect(features.length).toEqual(3);
  });

  it('should get features count from GeometryCollection', () => {
    const features = getFeatures(geometryCollection);
    expect(features.length).toEqual(0);
  });

  it('should get features count from Feature', () => {
    const features = getFeatures(feature);
    expect(features.length).toEqual(1);
  });

  it('should get features count from Geometry', () => {
    const features = getFeatures(geometry);
    expect(features.length).toEqual(0);
  });

  it('should return features count from empty FeatureCollection', () => {
    const emptyFeatureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const features = getFeatures(emptyFeatureCollection);
    expect(features.length).toEqual(0);
  });
});

describe('SourceMetadata', () => {
  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 1,
        geometry,
        properties: {
          number: 10,
          cat: 'cat1'
        }
      },
      {
        type: 'Feature',
        id: 1,
        geometry,
        properties: {
          number: 20,
          cat: 'cat1'
        }
      },
      {
        type: 'Feature',
        id: 1,
        geometry,
        properties: {
          number: 70,
          cat: 'cat2'
        }
      }
    ]
  };

  it('should build props and metadata properly with basic example', async () => {
    const fields = {
      sample: new Set(['number', 'cat']),
      aggregation: new Set(['number'])
    };

    const source = new GeoJsonSource(geojson);
    await source.init(fields);

    const props = source.getProps();
    expect(props).toEqual({ type: 'GeoJsonLayer', data: geojson });

    const metadata = source.getMetadata();
    expect(metadata).toEqual({
      geometryType: GEOM_TYPE,
      stats: [
        {
          name: 'number',
          min: 10,
          max: 70,
          avg: 100 / 3,
          sum: 100,
          sample: [10, 20, 70]
        },
        {
          name: 'cat',
          categories: [
            { category: 'cat1', frequency: 2 },
            { category: 'cat2', frequency: 1 }
          ]
        }
      ]
    });
  });

  it('should rebuild props and metadata properly after calling init again with different fields', async () => {
    const source = new GeoJsonSource(geojson);

    const fields1 = {
      sample: new Set(['number']),
      aggregation: new Set(['number'])
    };

    await source.init(fields1);

    const fields2 = {
      sample: new Set(['number', 'cat']),
      aggregation: new Set(['number'])
    };

    await source.init(fields2);

    const props = source.getProps();
    expect(props).toEqual({ type: 'GeoJsonLayer', data: geojson });

    const metadata = source.getMetadata();
    expect(metadata).toEqual({
      geometryType: GEOM_TYPE,
      stats: [
        {
          name: 'number',
          min: 10,
          max: 70,
          avg: 100 / 3,
          sum: 100,
          sample: [10, 20, 70]
        },
        {
          name: 'cat',
          categories: [
            { category: 'cat1', frequency: 2 },
            { category: 'cat2', frequency: 1 }
          ]
        }
      ]
    });
  });

  it('should initialize always for first time (isInitialized === false)', () => {
    const isInitialized = false;
    const sample: Set<string> = new Set();
    const aggregation: Set<string> = new Set();
    const newFields = { sample, aggregation };
    const currentFields: Set<string> = new Set();

    const result = shouldInitialize(isInitialized, newFields, currentFields);
    expect(result).toEqual(true);
  });

  it('should initialize with new fields', () => {
    const isInitialized = true;
    const sample: Set<string> = new Set(['field']);
    const aggregation: Set<string> = new Set();
    const newFields = { sample, aggregation };
    const currentFields: Set<string> = new Set();

    const result = shouldInitialize(isInitialized, newFields, currentFields);
    expect(result).toEqual(true);
  });

  it('should not initialize with same fields', () => {
    const isInitialized = true;
    const sample: Set<string> = new Set(['field']);
    const aggregation: Set<string> = new Set();
    const newFields = { sample, aggregation };
    const currentFields: Set<string> = new Set(['field']);

    const result = shouldInitialize(isInitialized, newFields, currentFields);
    expect(result).toEqual(false);
  });

  it('should not initialize with less fields', () => {
    const isInitialized = true;
    const sample: Set<string> = new Set(['field']);
    const aggregation: Set<string> = new Set();
    const newFields = { sample, aggregation };
    const currentFields: Set<string> = new Set(['field']);

    const result = shouldInitialize(isInitialized, newFields, currentFields);
    expect(result).toEqual(false);
  });
});
