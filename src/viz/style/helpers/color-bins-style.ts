import { NumericFieldStats, GeometryType, SourceMetadata } from '@/viz/source';
import { Layer } from '@/viz';
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
    viewport: options.viewport || false,
    ...options
  };
}

export function colorBinsStyle(
  featureProperty: string,
  options: Partial<ColorBinsOptionsStyle> = {}
) {
  const evalFN = async (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);

    validateParameters(opts);

    const dataOrigin = opts.viewport ? (layer as Layer) : meta;
    const breaks = await getBreaks(opts, dataOrigin, featureProperty);
    return calculateWithBreaks(featureProperty, breaks, meta.geometryType, opts);
  };

  const evalFNLegend = async (
    layer: StyledLayer,
    legendWidgetOptions: LegendWidgetOptions = { config: {} }
  ): Promise<LegendProperties[]> => {
    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    let legendProperties: LegendProperties[] = [];
    const { format, config } = legendWidgetOptions;
    const opts = defaultOptions(meta.geometryType, options);
    const dataOrigin = opts.viewport ? (layer as Layer) : meta;
    const breaks = await getBreaks(opts, dataOrigin, featureProperty);
    let stats;

    try {
      stats = await getMinMax(dataOrigin, featureProperty, options.viewport);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
    }

    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;

    if (stats) {
      let ranges = [...breaks, stats.max];
      const colors = getColors(opts.palette, ranges.length);
      ranges = [stats.min, ...ranges];

      const styles = getStyles(meta.geometryType, opts) as any;

      legendProperties = colors.map((c, i) => {
        const rangeValIni = format ? format(ranges[i]) : ranges[i];
        const rangeValEnd = format ? format(ranges[i + 1]) : ranges[i + 1];
        return {
          type: geometryType,
          color: c,
          label: `${rangeValIni} - ${rangeValEnd}`,
          width: styles.getSize,
          strokeColor:
            geometryType !== 'line' && options.property !== 'strokeColor'
              ? `rgba(${styles.getLineColor.join(',')})`
              : undefined
        };
      });

      legendProperties = config?.order === 'ASC' ? legendProperties : legendProperties.reverse();
    } else {
      // creates categories with no data
      for (let i = 0; i < opts.bins; i += 1) {
        legendProperties.push({
          type: geometryType,
          color: '#ccc',
          label: 'no data',
          width: 2
        });
      }
    }

    return legendProperties;
  };

  return new Style(evalFN, featureProperty, evalFNLegend, options.viewport);
}

async function getBreaks(
  opts: ColorBinsOptionsStyle,
  dataOrigin: Layer | SourceMetadata,
  featureProperty: string
) {
  if (!opts.breaks.length) {
    const data = (dataOrigin as SourceMetadata).stats
      ? ((dataOrigin as SourceMetadata).stats.find(
          f => f.name === featureProperty
        ) as NumericFieldStats)
      : (dataOrigin as Layer);
    const classifier = new Classifier(data, featureProperty);
    const breaks = await classifier.breaks(opts.bins - 1, opts.method, opts.viewport);
    return breaks;
  }

  return opts.breaks;
}

async function getMinMax(
  dataOrigin: Layer | SourceMetadata,
  featureProperty: string,
  viewport = false
) {
  let stats: NumericFieldStats | undefined;

  if (viewport) {
    const data = (await (dataOrigin as Layer).getViewportFeatures())
      .filter(f => f[featureProperty])
      .map(f => f[featureProperty] as number);

    if (data.length) {
      stats = {
        name: featureProperty,
        min: Math.min(...data),
        max: Math.max(...data)
      };
    }
  } else {
    stats = (dataOrigin as SourceMetadata).stats.find(
      f => f.name === featureProperty
    ) as NumericFieldStats;
  }

  return stats;
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
