import { NumericFieldStats, GeometryType } from '@/viz/source';
import { LegendProperties, LegendGeometryType, LegendWidgetOptions } from '@/viz/legend';
import { StyledLayer } from '../layer-style';
import { range } from './math-utils';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { Style, BasicOptionsStyle, getStyles, getStyleValue } from '../index';
import { sizeRangeValidation } from '../validators';
import { SizeProperty, isSizeProperty } from './properties-by-helper';

export interface SizeContinuousOptionsStyle extends Partial<BasicOptionsStyle> {
  // The minimum value of the data range for the size ramp. Defaults to the globalMIN of the dataset.
  rangeMin?: number;
  // The maximum value of the data range for the size ramp. Defaults to the globalMAX of the dataset.
  rangeMax?: number;
  // Min/max size array as a string. Default is [2, 14] for point geometries and [1, 10] for lines.
  sizeRange: number[];
  // Size applied to features which the attribute value is null. Default 0
  nullSize: number;
  // Styling property.
  property?: SizeProperty;
}

function defaultOptions(
  geometryType: GeometryType | undefined,
  options: Partial<SizeContinuousOptionsStyle>
): SizeContinuousOptionsStyle {
  return {
    color: getDefaultColor(geometryType),
    sizeRange: getDefaultSizeRange(geometryType),
    nullSize: getStyleValue('nullSize', geometryType, options),
    opacity: 0.7,
    ...options
  };
}

export function sizeContinuousStyle(
  featureProperty: string,
  options: Partial<SizeContinuousOptionsStyle> = {}
) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);
    validateParameters(opts, meta.geometryType);

    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;

    return calculate(
      featureProperty,
      meta.geometryType,
      opts,
      getRangeMin(stats, opts, meta.geometryType),
      getRangeMax(stats, opts, meta.geometryType)
    );
  };

  const evalFNLegend = (
    layer: StyledLayer,
    legendWidgetOptions: LegendWidgetOptions = { config: {} }
  ): LegendProperties[] => {
    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    const opts = defaultOptions(meta.geometryType, options);
    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;
    const styles = getStyles(meta.geometryType, opts) as any;
    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;
    const color = geometryType === 'line' ? styles.getLineColor : styles.getFillColor;
    const samples = legendWidgetOptions.config.samples || 4;
    const INC = 1 / (samples - 1);
    const result = [] as LegendProperties[];
    const min = opts.rangeMin !== undefined ? opts.rangeMin : stats.min;
    const max = opts.rangeMax !== undefined ? opts.rangeMax : stats.max;

    for (let i = 0; result.length < samples; i += INC) {
      const value = i * (max - min) + min;
      result.push({
        type: geometryType,
        color: `rgba(${color.join(',')})`,
        label: value,
        width: range(
          getRangeMin(stats, opts, meta.geometryType),
          getRangeMax(stats, opts, meta.geometryType),
          opts.sizeRange[0],
          opts.sizeRange[1],
          meta.geometryType === 'Point' ? Math.sqrt(value) : value
        ),
        strokeColor: `rgba(${styles.getLineColor.join(',')})`
      });
    }

    return result;
  };

  return new Style(evalFN, featureProperty, evalFNLegend);
}

function getRangeMin(
  stats: NumericFieldStats,
  opts: SizeContinuousOptionsStyle,
  geometryType: GeometryType | undefined
) {
  const rangeMin = opts.rangeMin === undefined ? stats.min : opts.rangeMin;
  return geometryType === 'Point' ? Math.sqrt(rangeMin) : rangeMin;
}

function getRangeMax(
  stats: NumericFieldStats,
  opts: SizeContinuousOptionsStyle,
  geometryType: GeometryType | undefined
) {
  const rangeMax = opts.rangeMax === undefined ? stats.max : opts.rangeMax;
  return geometryType === 'Point' ? Math.sqrt(rangeMax) : rangeMax;
}

function calculate(
  featureProperty: string,
  geometryType: GeometryType | undefined,
  options: SizeContinuousOptionsStyle,
  rangeMin: number,
  rangeMax: number
) {
  const styles = getStyles(geometryType, options);

  /**
   * @private
   * Gets the size for the feature provided by parameter
   * according to the breaks and sizes options.
   *
   * @param feature - feature used to calculate the size.
   * @returns size.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSizeValue = (feature: Record<string, any>) => {
    let featureValue: number = feature.properties[featureProperty];

    if (featureValue === null || featureValue === undefined) {
      return options.nullSize;
    }

    if (geometryType === 'Point') {
      featureValue = Math.sqrt(featureValue);
    }

    return range(rangeMin, rangeMax, options.sizeRange[0], options.sizeRange[1], featureValue);
  };

  let obj;

  if (geometryType === 'Point') {
    if (!options.property || options.property === 'size') {
      obj = {
        getRadius: getSizeValue,
        pointRadiusMinPixels: options.sizeRange[0],
        pointRadiusMaxPixels: options.sizeRange[1],
        radiusUnits: 'pixels'
      };
    } else if (options.property === 'strokeWidth') {
      obj = { getLineWidth: getSizeValue };
    }
  } else {
    obj = {
      getLineWidth: getSizeValue,
      lineWidthMinPixels: options.sizeRange[0],
      lineWidthMaxPixels: options.sizeRange[1],
      radiusUnits: 'pixels'
    };
  }

  return {
    ...styles,
    ...obj,
    updateTriggers: { getRadius: getSizeValue, getLineWidth: getSizeValue }
  };
}

export function getDefaultSizeRange(geometryType?: GeometryType) {
  const defaultSizeRange = {
    Point: [2, 40],
    Line: [1, 10],
    Polygon: []
  };

  return geometryType ? defaultSizeRange[geometryType] : [];
}

function getDefaultColor(geometryType?: GeometryType) {
  if (geometryType === 'Point') {
    return '#FFB927';
  }

  return getStyleValue('color', geometryType, {});
}

function validateParameters(options: SizeContinuousOptionsStyle, geometryType?: GeometryType) {
  if (geometryType === 'Polygon') {
    throw new CartoStylingError(
      "Polygon layer doesn't support sizeContinuousStyle",
      stylingErrorTypes.GEOMETRY_TYPE_UNSUPPORTED
    );
  }

  if (options.rangeMin && options.rangeMax && options.rangeMin >= options.rangeMax) {
    throw new CartoStylingError(
      'rangeMin must be greater than rangeMin',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.sizeRange && !sizeRangeValidation(options.sizeRange)) {
    throw new CartoStylingError(
      'sizeRange must be an array of 2 numbers, [min, max]',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.nullSize && options.nullSize < 0) {
    throw new CartoStylingError(
      'nullSize must be greater or equal to 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.property && !isSizeProperty(options.property)) {
    throw new CartoStylingError(
      `property '${options.property}' is not valid`,
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }
}
