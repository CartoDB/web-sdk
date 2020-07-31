import { NumericFieldStats, GeometryType, SourceMetadata } from '@/viz/source';
import { LegendProperties, LegendGeometryType, LegendWidgetOptions } from '@/viz/legend';
import { getColors, getUpdateTriggers, hexToRgb, findIndexForBinBuckets } from './utils';
import { Classifier, ClassificationMethod } from '../../utils/Classifier';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { StyledLayer } from '../layer-style';
import { getStyleValue, getStyles, Style, BasicOptionsStyle } from '..';
import { colorValidation } from '../validators';
import { ColorProperty, isColorProperty } from './properties-by-helper';

const DEFAULT_METHOD = 'quantiles';

export interface ColorBinsOptionsStyle extends Partial<BasicOptionsStyle> {
  // Number of size classes (bins) for map. Default is 5.
  bins: number;
  // Classification method of data: "quantiles", "equal", "stdev". Default is "quantiles".
  method: ClassificationMethod;
  // Assign manual class break values.
  breaks: number[];
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
  options: Partial<ColorBinsOptionsStyle>
): ColorBinsOptionsStyle {
  let bins = 5;

  if (options.breaks && options.breaks.length && !options.bins) {
    bins = options.breaks.length + 1;
  }

  return {
    bins,
    method: DEFAULT_METHOD,
    breaks: [],
    palette: getPalette(options.method || DEFAULT_METHOD),
    nullColor: getStyleValue('nullColor', geometryType, options),
    othersColor: getStyleValue('othersColor', geometryType, options),
    ...options
  };
}

export function colorBinsStyle(
  featureProperty: string,
  options: Partial<ColorBinsOptionsStyle> = {}
) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);

    validateParameters(opts);

    return calculateWithBreaks(
      featureProperty,
      getBreaks(opts, meta, featureProperty),
      meta.geometryType,
      opts
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
    const breaks = getBreaks(opts, meta, featureProperty);
    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;
    let ranges = [...breaks, stats.max];
    const colors = getColors(opts.palette, ranges.length);
    ranges = [stats.min, ...ranges];
    const styles = getStyles(meta.geometryType, opts) as any;
    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;

    const result = colors.map((c, i) => {
      return {
        type: geometryType,
        color: c,
        label: `${ranges[i]} - ${ranges[i + 1]}`,
        width: styles.getSize,
        strokeColor:
          geometryType !== 'line' && options.property !== 'strokeColor'
            ? `rgba(${styles.getLineColor.join(',')})`
            : undefined
      };
    });

    return legendWidgetOptions.config.order === 'DESC' ? result.reverse() : result;
  };

  return new Style(evalFN, featureProperty, evalFNLegend);
}

function getBreaks(opts: ColorBinsOptionsStyle, meta: SourceMetadata, featureProperty: string) {
  if (!opts.breaks.length) {
    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;
    const classifier = new Classifier(stats);
    const breaks = classifier.breaks(opts.bins - 1, opts.method);
    return breaks;
  }

  return opts.breaks;
}

function calculateWithBreaks(
  featureProperty: string,
  breaks: number[],
  geometryType: GeometryType | undefined,
  options: ColorBinsOptionsStyle
) {
  const styles = getStyles(geometryType, options);

  // For 3 breaks, we create 4 ranges of colors. For example: [30,80,120]
  // - From -inf to 29
  // - From 30 to 79
  // - From 80 to 119
  // - From 120 to +inf
  // Values lower than 0 will be in the first bucket and values higher than 120 will be in the last one.
  const ranges = [...breaks, Number.MAX_SAFE_INTEGER];

  const colors = getColors(options.palette, ranges.length);
  const rgbaNullColor = hexToRgb(options.nullColor);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFillColor = (feature: Record<string, any>) => {
    const featureValue = feature.properties[featureProperty];

    if (featureValue === null || featureValue === undefined) {
      return rgbaNullColor;
    }

    const featureValueIndex = findIndexForBinBuckets(ranges, featureValue);

    return hexToRgb(colors[featureValueIndex]);
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

function validateParameters(options: ColorBinsOptionsStyle) {
  if (options.bins < 1 || options.bins > 7) {
    throw new CartoStylingError(
      'Manual bins must be a number between 1 and 7',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.breaks.length > 0 && options.breaks.length !== options.bins - 1) {
    throw new CartoStylingError(
      'Manual breaks are provided and bins!=breaks.length + 1',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (
    options.breaks.length > 0 &&
    Array.isArray(options.palette) &&
    options.breaks.length !== options.palette.length - 1
  ) {
    throw new CartoStylingError(
      'Manual breaks are provided and breaks.length!=palette.length-1',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (
    options.breaks.length === 0 &&
    Array.isArray(options.palette) &&
    options.bins !== options.palette.length
  ) {
    throw new CartoStylingError(
      'Number of bins does not match with palette length',
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

function getPalette(method: ClassificationMethod) {
  const defaultPalette = {
    quantiles: 'purpor',
    equal: 'purpor',
    stdev: 'temps'
  };

  return defaultPalette[method];
}
