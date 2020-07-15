import { Feature, FeatureCollection, Geometry, GeometryCollection } from 'geojson';
import { SourceError } from '@/viz/errors/source-error';
import { GeoJSONSource, getGeomType, getFeatures, DEFAULT_GEOM } from '../GeoJSONSource';

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
  it('should build props and metadata properly with basic example', async () => {
    const source = new GeoJSONSource(geojson);
    await source.addField('number');
    await source.addField('cat');
    await source.init();

    const props = source.getProps();
    expect(props).toEqual({ type: 'GeoJSONLayer', data: getFeatures(geojson) });

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
    const source = new GeoJSONSource(geojson);
    await source.addField('number');
    await source.init();

    await source.addField('cat');
    await source.init();

    const props = source.getProps();
    expect(props).toEqual({ type: 'GeoJSONLayer', data: getFeatures(geojson) });

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

  it('should fail if fields does not exist in geoJSON', async () => {
    const emptyGeojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const source = new GeoJSONSource(emptyGeojson);
    await source.addField('number');
    await source.addField('cat');

    expect(async () => {
      await source.init();
    }).rejects.toEqual(
      new SourceError("Field/s 'number, cat' do/es not exist in geoJSON properties")
    );
  });

  it('should fail if a field does not exist in geoJSON', async () => {
    const geojsonWithoutNumberField: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 1,
          geometry,
          properties: {
            cat: 'cat1'
          }
        },
        {
          type: 'Feature',
          id: 1,
          geometry,
          properties: {
            cat: 'cat1'
          }
        },
        {
          type: 'Feature',
          id: 1,
          geometry,
          properties: {
            cat: 'cat2'
          }
        }
      ]
    };

    const source = new GeoJSONSource(geojsonWithoutNumberField);
    await source.addField('number');
    await source.addField('cat');

    expect(async () => {
      await source.init();
    }).rejects.toEqual(new SourceError("Field/s 'number' do/es not exist in geoJSON properties"));
  });
});

describe('GeoJSON Source', () => {
  describe('getFeatures', () => {
    it('should return all features when no filters are added', () => {
      const source = new GeoJSONSource(geojson);

      expect(source.getFeatures()).toEqual([
        { cat: 'cat1', number: 10 },
        { cat: 'cat1', number: 20 },
        { cat: 'cat2', number: 70 }
      ]);
    });

    it('should return filtered features when filters are added', () => {
      const source = new GeoJSONSource(geojson);
      source.addFilter('testFilter', { cat: { in: ['cat1'] } });
      expect(source.getFeatures()).toEqual([
        { cat: 'cat1', number: 10 },
        { cat: 'cat1', number: 20 }
      ]);
    });
  });
});
