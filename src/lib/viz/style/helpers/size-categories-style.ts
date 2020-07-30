import { CategoryFieldStats, Category, GeometryType, SourceMetadata } from '@/viz/source';
import { LegendProperties, LegendGeometryType } from '@/viz/legend';
import { calculateSizeBins } from './utils';
import { Style, getStyleValue, BasicOptionsStyle, getStyles } from '..';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { StyledLayer } from '../layer-style';
import { sizeRangeValidation } from '../validators';
import { SizeProperty, isSizeProperty } from './properties-by-helper';

export interface SizeCategoriesOptionsStyle extends Partial<BasicOptionsStyle> {
  // Number of categories. Default is 11. Values can range from 1 to 16.
  top: number;
  // Category list. Must be a valid list of categories.
  categories: string[];
  // Min/max size array as a string. Default is [2, 14] for point geometries and [1, 10] for lines.
  sizeRange: number[];
  // Size for null values
  nullSize: number;
  // Styling property.
  property?: SizeProperty;
}

function defaultOptions(
  geometryType: GeometryType | undefined,
  options: Partial<SizeCategoriesOptionsStyle>
): SizeCategoriesOptionsStyle {
  return {
    top: 11,
    categories: [],
    opacity: 0.7,
    color: getDefaultColor(geometryType, options),
    sizeRange: getDefaultSizeRange(geometryType, options),
    nullSize: getStyleValue('nullSize', geometryType, options),
    ...options
  };
}

/**
 * @public
 * Creates an style based on a string field with a category.
 *
 * @param featureProperty - Name of the attribute to symbolize by
 * @param options - Additional options
 * @returns The style based on the `featureProperty` attribute.
 */
export function sizeCategoriesStyle(
  featureProperty: string,
  options: Partial<SizeCategoriesOptionsStyle> = {}
) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);
    validateParameters(opts, meta.geometryType);

    const categories = getCategories(opts, meta, featureProperty).slice(0, opts.top);

    return calculateWithCategories(featureProperty, categories, meta.geometryType, opts);
  };

  const evalFNLegend = (layer: StyledLayer, properties = {}): LegendProperties[] => {
    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    const opts = defaultOptions(meta.geometryType, options);
    const categories = getCategories(opts, meta, featureProperty);
    const categoriesTop = categories.slice(0, opts.top);
    const sizes = calculateSizeBins(categoriesTop.length - 1, opts.sizeRange);

    // TODO Others label could be an option
    if (categories.length > opts.top) {
      sizes.push(sizes[0]);
      categoriesTop.push('Others');
    }

    const styles = getStyles(meta.geometryType, opts) as any;
    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;
    const color = geometryType === 'line' ? styles.getLineColor : styles.getFillColor;

    return categoriesTop.map((c, i) => {
      return {
        type: geometryType,
        color: `rgba(${color.join(',')})`,
        label: c,
        width: sizes[i],
        strokeColor: `rgba(${styles.getLineColor.join(',')})`,
        ...properties
      };
    });
  };

  return new Style(evalFN, featureProperty, evalFNLegend);
}

function getCategories(
  opts: SizeCategoriesOptionsStyle,
  meta: SourceMetadata,
  featureProperty: string
) {
  let categories;

  if (opts.categories.length) {
    categories = opts.categories;
  } else {
    const stats = meta.stats.find(c => c.name === featureProperty) as CategoryFieldStats;

    if (!stats.categories || !stats.categories.length) {
      throw new CartoStylingError(`Current dataset has not categories for '${featureProperty}'`);
    }

    categories = stats.categories.map((c: Category) => c.category);
  }

  return categories;
}

function calculateWithCategories(
  featureProperty: string,
  categories: string[],
  geometryType: GeometryType | undefined,
  options: SizeCategoriesOptionsStyle
) {
  const styles = getStyles(geometryType, options);

  const sizes = calculateSizeBins(categories.length - 1, options.sizeRange);

  /**
   * @private
   * Gets the size for the feature provided by parameter
   * according to the categories and sizes options.
   *
   * @param feature - feature used to calculate the size.
   * @returns size.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSizeValue = (feature: Record<string, any>) => {
    const featureValue: string = feature.properties[featureProperty];

    if (!featureValue) {
      return options.nullSize;
    }

    const featureValueIndex = categories.indexOf(featureValue);
    return sizes[featureValueIndex];
  };

  // gets the min and max size
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  let obj;

  if (geometryType === 'Point') {
    if (!options.property || options.property === 'size') {
      obj = {
        getRadius: getSizeValue,
        pointRadiusMinPixels: minSize,
        pointRadiusMaxPixels: maxSize,
        radiusUnits: 'pixels'
      };
    } else if (options.property === 'strokeWidth') {
      obj = { getLineWidth: getSizeValue, lineWidthUnits: 'pixels' };
    }
  } else {
    obj = {
      getLineWidth: getSizeValue,
      lineWidthMinPixels: minSize,
      lineWidthMaxPixels: maxSize,
      radiusUnits: 'pixels'
    };
  }

  return {
    ...styles,
    ...obj,
    updateTriggers: { getRadius: getSizeValue, getLineWidth: getSizeValue }
  };
}

function validateParameters(options: SizeCategoriesOptionsStyle, geometryType?: GeometryType) {
  if (geometryType === 'Polygon') {
    throw new CartoStylingError(
      "Polygon layer doesn't support sizeCategoriesStyle",
      stylingErrorTypes.GEOMETRY_TYPE_UNSUPPORTED
    );
  }

  if (options.top < 1 || options.top > 12) {
    throw new CartoStylingError(
      'Manual top provided should be a number between 1 and 12',
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

export function getDefaultSizeRange(
  geometryType: GeometryType | undefined,
  options: Partial<SizeCategoriesOptionsStyle>
) {
  if (geometryType === 'Point') {
    return options.sizeRange || [2, 20];
  }

  return getStyleValue('sizeRange', geometryType, options);
}

function getDefaultColor(
  geometryType: GeometryType | undefined,
  options: Partial<SizeCategoriesOptionsStyle>
) {
  if (geometryType === 'Point') {
    return options.color || '#F46D43';
  }

  return getStyleValue('color', geometryType, options);
}
