import { GeoJSON, GeoJsonGeometryTypes, Feature } from 'geojson';
import { uuidv4 } from '@/core/utils/uuid';
import { aggregate, AggregationType } from '@/data/operations/aggregation/aggregation';

import {
  Source,
  SourceProps,
  SourceMetadata,
  NumericFieldStats,
  CategoryFieldStats,
  GeometryType,
  StatFields,
  shouldInitialize
} from './Source';

import { sourceErrorTypes, SourceError } from '../errors/source-error';

interface GeoJsonSourceProps extends SourceProps {
  data: GeoJSON;
}

export const DEFAULT_GEOM = 'Point';
const MAX_SAMPLE_SIZE = 1000;

export class GeoJsonSource extends Source {
  private _geojson: GeoJSON;
  private _metadata?: SourceMetadata;
  private _props?: GeoJsonSourceProps;
  private _numericFieldValues: Record<string, number[]>;
  private _categoryFieldValues: Record<string, string[]>;
  private _fields: StatFields;

  constructor(geojson: GeoJSON) {
    const id = `geojson-${uuidv4()}`;
    super(id);
    this.sourceType = 'GeoJsonSource';

    this._geojson = geojson;
    this._numericFieldValues = {};
    this._categoryFieldValues = {};
    this._fields = { sample: new Set(), aggregation: new Set() };
  }

  public getProps(): GeoJsonSourceProps {
    if (!this.isInitialized || !this._props) {
      throw new SourceError('getProps requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    return this._props;
  }

  public getMetadata(): SourceMetadata {
    if (!this.isInitialized || !this._metadata) {
      throw new SourceError('GetMetadata requires init call', sourceErrorTypes.INIT_SKIPPED);
    }

    return this._metadata;
  }

  public async init(fields: StatFields): Promise<boolean> {
    if (!shouldInitialize(this.isInitialized, fields, this._fields)) {
      return true;
    }

    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.warn('GeoJsonSource reinitialized');
    }

    this._props = { type: 'GeoJsonLayer', data: this._geojson };
    this._metadata = this._buildMetadata(fields);

    this.isInitialized = true;
    return true;
  }

  private _buildMetadata(fields: StatFields) {
    const geometryType = getGeomType(this._geojson);

    this._saveFields(fields);
    const stats = this._getStats();

    return { geometryType, stats };
  }

  private _getStats(): (NumericFieldStats | CategoryFieldStats)[] {
    let stats: (NumericFieldStats | CategoryFieldStats)[] = [];

    const fields = [...new Set([...this._fields.sample, ...this._fields.aggregation])];

    if (!fields.length) {
      return stats;
    }

    const features = getFeatures(this._geojson);

    if (features.length) {
      this._extractFeaturesValues(features, fields);
      stats = this._calculateStats();
    }

    validateFieldNamesInStats(fields, stats);

    return stats;
  }

  private _extractFeaturesValues(features: Feature[], fields: string[]) {
    features.forEach(feature => {
      const { properties } = feature;

      // values
      if (properties) {
        fields.forEach(propName => {
          this._saveFeatureValue(propName, properties[propName]);
        });
      }
    });
  }

  // eslint-disable-next-line consistent-return
  private _saveFeatureValue(propName: string, propValue: string | number | unknown) {
    if (propValue) {
      if (typeof propValue === 'number') {
        if (this._categoryFieldValues[propName]) {
          throw new SourceError(
            `Unsupported GeoJSON: the property '${propName}' has different types in different features.`
          );
        }

        if (!this._numericFieldValues[propName]) {
          this._numericFieldValues[propName] = [];
        }

        return this._numericFieldValues[propName].push(propValue);
      }

      if (typeof propValue === 'string') {
        if (this._numericFieldValues[propName]) {
          throw new SourceError(
            `Unsupported GeoJSON: the property '${propName}' has different types in different features.`
          );
        }

        if (!this._categoryFieldValues[propName]) {
          this._categoryFieldValues[propName] = [];
        }

        return this._categoryFieldValues[propName].push(propValue);
      }

      throw new SourceError(
        `Unsupported GeoJSON: the property '${propName}' has unsupported value '${propValue}'.`
      );
    }
  }

  private _calculateStats() {
    const numericStats = this._calculateNumericStats();
    const categoryStats = this._calculateCategoryStats();

    // free memory
    this._numericFieldValues = {};
    this._categoryFieldValues = {};

    return [...numericStats, ...categoryStats];
  }

  private _calculateNumericStats(): NumericFieldStats[] {
    const numericStats: NumericFieldStats[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [propName, values] of Object.entries(this._numericFieldValues)) {
      const min = aggregate(values, AggregationType.MIN);
      const max = aggregate(values, AggregationType.MAX);
      const avg = aggregate(values, AggregationType.AVG);
      const sum = aggregate(values, AggregationType.SUM);
      const sample = createSample(values);

      numericStats.push({
        name: propName,
        min,
        max,
        avg,
        sum,
        sample
      });
    }

    return numericStats;
  }

  private _calculateCategoryStats(): CategoryFieldStats[] {
    const categoryStats: CategoryFieldStats[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [propName, values] of Object.entries(this._categoryFieldValues)) {
      const categoryFrequency: Record<string, number> = {};

      values.forEach(v => {
        if (!categoryFrequency[v]) {
          categoryFrequency[v] = 0;
        }

        categoryFrequency[v] += 1;
      });

      const categories = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const [category, frequency] of Object.entries(categoryFrequency)) {
        categories.push({ category, frequency });
      }

      categoryStats.push({ name: propName, categories });
    }

    return categoryStats;
  }

  private _saveFields(fields: StatFields) {
    this._fields.sample = new Set([...fields.sample]);
    this._fields.aggregation = new Set([...fields.aggregation]);
  }
}

export function getGeomType(geojson: GeoJSON): GeometryType {
  if (geojson.type === 'FeatureCollection') {
    return geojson.features.length ? getGeomType(geojson.features[0]) : DEFAULT_GEOM;
  }

  if (geojson.type === 'Feature') {
    return parseGeometryType(geojson.geometry.type);
  }

  if (geojson.type === 'GeometryCollection') {
    return geojson.geometries.length ? parseGeometryType(geojson.geometries[0].type) : DEFAULT_GEOM;
  }

  return parseGeometryType(geojson.type);
}

function parseGeometryType(geoJsonGeometryType: GeoJsonGeometryTypes): GeometryType {
  if (['Point', 'MultiPoint'].includes(geoJsonGeometryType)) {
    return 'Point';
  }

  if (['LineString', 'MultiLineString'].includes(geoJsonGeometryType)) {
    return 'Line';
  }

  return 'Polygon';
}

export function getFeatures(geojson: GeoJSON): Feature[] {
  if (geojson.type === 'FeatureCollection') {
    return geojson.features;
  }

  if (geojson.type === 'Feature') {
    return [geojson];
  }

  return [];
}

function createSample(values: number[]) {
  if (values.length < MAX_SAMPLE_SIZE) {
    return values;
  }

  const shuffled = values.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, MAX_SAMPLE_SIZE);
}

export function validateFieldNamesInStats(
  fields: string[],
  stats: (NumericFieldStats | CategoryFieldStats)[]
) {
  const existingStatsFields = stats.filter(s => fields.includes(s.name)).map(s => s.name);

  // some fields do not have data in the geoJSON
  if (existingStatsFields.length !== fields.length) {
    const noDataFields = fields.filter(f => !existingStatsFields.includes(f));

    throw new SourceError(
      `Field/s '${noDataFields.join(', ')}' do/es not exist in geoJSON properties`
    );
  }
}
