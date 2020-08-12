import { CategoryFieldStats, Category, GeometryType, SourceMetadata } from '@/viz/source';
import { LegendProperties, LegendGeometryType } from '@/viz/legend';
import { Layer } from '@/viz';
import { convertArrayToObjectWithValues } from '../../utils/object';
import { getColors, getUpdateTriggers, hexToRgb } from './utils';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { StyledLayer } from '../layer-style';
import { getStyleValue, getStyles, BasicOptionsStyle, Style } from '..';
import { colorValidation } from '../validators';
import { ColorProperty, isColorProperty } from './properties-by-helper';

export const DEFAULT_PALETTE = 'bold';

export interface ColorCategoriesOptionsStyle extends Partial<BasicOptionsStyle> {
  // Number of categories. Default is 11. Values can range from 1 to 16.
  top: number;
  // Category list. Must be a valid list of categories.
  categories: string[];
  // Palette that can be a named cartocolor palette or other valid color palette.
  palette: string[] | string;
  // Color applied to features which the attribute value is null.
  nullColor: string;
  // Color applied to features which the attribute value is not in the breaks.
  othersColor: string;
  // Styling property.
  property?: ColorProperty;
}

function defaultOptions(
  geometryType: GeometryType | undefined,
  options: Partial<ColorCategoriesOptionsStyle>
): ColorCategoriesOptionsStyle {
  return {
    top: 11,
    categories: [],
    palette: DEFAULT_PALETTE,
    nullColor: getStyleValue('nullColor', geometryType, options),
    othersColor: getStyleValue('othersColor', geometryType, options),
    viewport: options.viewport || false,
    ...options
  };
}

export function colorCategoriesStyle(
  featureProperty: string,
  options: Partial<ColorCategoriesOptionsStyle> = {}
) {
  const evalFN = async (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);

    validateParameters(opts);

    const dataOrigin = opts.viewport ? (layer as Layer) : meta;
    const categories = (await getCategories(opts, dataOrigin, featureProperty)).slice(0, opts.top);

    return calculateWithCategories(featureProperty, categories, meta.geometryType, opts);
  };

  const evalFNLegend = async (layer: StyledLayer, properties = {}): Promise<LegendProperties[]> => {
    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    let legendProperties: LegendProperties[] = [];
    const opts = defaultOptions(meta.geometryType, options);
    const dataOrigin = opts.viewport ? (layer as Layer) : meta;
    const categories = await getCategories(opts, dataOrigin, featureProperty);
    const categoriesTop = categories.slice(0, opts.top);
    const colors = getColors(opts.palette, categoriesTop.length).map(hexToRgb);
    const categoriesWithColors = convertArrayToObjectWithValues(categoriesTop, colors);

    if (categories.length > opts.top) {
      categoriesWithColors.Others = hexToRgb(opts.othersColor);
    }

    const styles = getStyles(meta.geometryType, opts) as any;
    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;

    if (Object.keys(categoriesWithColors).length) {
      legendProperties = Object.keys(categoriesWithColors).map(c => {
        return {
          type: geometryType,
          color: `rgba(${categoriesWithColors[c].join(',')})`,
          label: c,
          width: styles.getSize,
          strokeColor:
            geometryType !== 'line' && options.property !== 'strokeColor'
              ? `rgba(${styles.getLineColor.join(',')})`
              : undefined,
          ...properties
        };
      });
    } else {
      legendProperties = [
        {
          type: geometryType,
          color: '#ccc',
          label: 'no data',
          width: 2
        }
      ];
    }

    return legendProperties;
  };

  return new Style(evalFN, featureProperty, evalFNLegend, options.viewport);
}

async function getCategories(
  opts: ColorCategoriesOptionsStyle,
  dataOrigin: Layer | SourceMetadata,
  featureProperty: string
) {
  let categories: string[] = [];

  if (opts.categories.length) {
    categories = opts.categories;
  } else {
    const layer = dataOrigin as Layer;
    const meta = dataOrigin as SourceMetadata;

    if (opts.viewport) {
      try {
        categories = [
          ...new Set(
            (await layer.getViewportFeatures())
              .filter(f => f[featureProperty])
              .map(f => f[featureProperty] as string)
          )
        ];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err);
      }
    } else {
      const stats = meta.stats.find(c => c.name === featureProperty) as CategoryFieldStats;

      if (!stats.categories || !stats.categories.length) {
        throw new CartoStylingError(`Current dataset has not categories for '${featureProperty}'`);
      }

      categories = stats.categories.map((c: Category) => c.category);
    }
  }

  return categories;
}

function calculateWithCategories(
  featureProperty: string,
  categories: string[],
  geometryType: GeometryType | undefined,
  options: ColorCategoriesOptionsStyle
) {
  const styles = getStyles(geometryType, options);

  const colors = getColors(options.palette, categories.length).map(hexToRgb);
  const categoriesWithColors = convertArrayToObjectWithValues(categories, colors);
  const rgbaNullColor = hexToRgb(options.nullColor);
  const rgbaOthersColor = hexToRgb(options.othersColor);

  const getFillColor = (feature: Record<string, Record<string, number | string>>) => {
    const category = feature.properties[featureProperty];

    if (!category) {
      return rgbaNullColor;
    }

    return categoriesWithColors[category] || rgbaOthersColor;
  };

  let geomStyles;

  if (geometryType === 'Line' || options.property === 'strokeColor') {
    geomStyles = {
      getLineColor: getFillColor,
      updateTriggers: getUpdateTriggers({
        getLineColor: getFillColor
      })
    };
  } else {
    geomStyles = {
      getFillColor,
      updateTriggers: getUpdateTriggers({
        getFillColor
      })
    };
  }

  return {
    ...styles,
    ...geomStyles
  };
}

function validateParameters(options: ColorCategoriesOptionsStyle) {
  const explicitCategories = options.categories.length > 0;
  const explicitColorsList = typeof options.palette !== 'string';

  if (explicitCategories && explicitColorsList) {
    if (options.categories.length !== options.palette.length) {
      throw new CartoStylingError(
        'Manual categories provided and the length of categories and palette mismatch',
        stylingErrorTypes.PROPERTY_MISMATCH
      );
    }
  }

  if (
    options.categories.length > 0 &&
    Array.isArray(options.palette) &&
    options.categories.length !== options.palette.length
  ) {
    throw new CartoStylingError(
      'Manual categories provided and the length of categories and palette mismatch',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.top < 1 || options.top > 12) {
    throw new CartoStylingError(
      'Manual top provided should be a number between 1 and 12',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.nullColor && !colorValidation(options.nullColor)) {
    throw new CartoStylingError(
      `nullColor '${options.color}' is not valid`,
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.othersColor && !colorValidation(options.othersColor)) {
    throw new CartoStylingError(
      `othersColor '${options.color}' is not valid`,
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.property && !isColorProperty(options.property)) {
    throw new CartoStylingError(
      `property '${options.property}' is not valid`,
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }
}
