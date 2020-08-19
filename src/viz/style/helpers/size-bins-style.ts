import { NumericFieldStats, GeometryType, SourceMetadata } from '@/viz/source';
import { Layer } from '@/viz';
import { LegendProperties, LegendGeometryType, LegendWidgetOptions } from '@/viz/legend';
import { findIndexForBinBuckets, calculateSizeBins } from './utils';
import { Classifier, ClassificationMethod } from '../../utils/Classifier';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { StyledLayer } from '../layer-style';
import { Style, BasicOptionsStyle, getStyles, getStyleValue } from '..';
import { sizeRangeValidation } from '../validators';
import { SizeProperty, isSizeProperty } from './properties-by-helper';

export interface SizeBinsOptionsStyle extends Partial<BasicOptionsStyle> {
  // Number of size classes (bins) for map. Default is 5.
  bins: number;
  // Classification method of data: "quantiles", "equal", "stdev". Default is "quantiles".
  method: ClassificationMethod;
  // Assign manual class break values.
  breaks: number[];
  // Min/max size array as a string. Default is [2, 14] for point geometries and [1, 10] for lines.
  sizeRange: number[];
  // Size applied to features which the attribute value is null. Default 0
  nullSize: number;
  // Styling property.
  property?: SizeProperty;
}

function defaultOptions(
  geometryType: GeometryType | undefined,
  options: Partial<SizeBinsOptionsStyle>
): SizeBinsOptionsStyle {
  let bins = 5;

  if (options.breaks && options.breaks.length && !options.bins) {
    bins = options.breaks.length + 1;
  }

  return {
    bins,
    method: 'quantiles',
    breaks: [],
    sizeRange: getStyleValue('sizeRange', geometryType, options),
    nullSize: 0,
    opacity: 0.7,
    viewport: options.viewport || false,
    ...options
  };
}

export function sizeBinsStyle(
  featureProperty: string,
  options: Partial<SizeBinsOptionsStyle> = {}
) {
  const evalFN = async (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);
    validateParameters(opts, meta.geometryType);

    if (meta.geometryType === 'Polygon') {
      throw new CartoStylingError(
        "Polygon layer doesn't support sizeBinsStyle",
        stylingErrorTypes.GEOMETRY_TYPE_UNSUPPORTED
      );
    }

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
      const sizes = await calculateSizeBins(breaks.length, opts.sizeRange);
      const styles = getStyles(meta.geometryType, options) as any;
      ranges = [stats.min, ...ranges];
      const color = geometryType === 'line' ? styles.getLineColor : styles.getFillColor;

      legendProperties = sizes.map((s, i) => {
        const rangeValIni = format ? format(ranges[i]) : ranges[i];
        const rangeValEnd = format ? format(ranges[i + 1]) : ranges[i + 1];
        return {
          type: geometryType,
          color: `rgba(${color.join(',')})`,
          label: `${rangeValIni} - ${rangeValEnd}`,
          width: s,
          strokeColor: `rgba(${styles.getLineColor.join(',')})`
        };
      });

      legendProperties = config?.order === 'ASC' ? legendProperties : legendProperties.reverse();
    } else {
      // creates categories with no data
      legendProperties = [
        {
          type: geometryType,
          color: '#ccc',
          label: 'no data',
          width: opts.sizeRange[0]
        },
        {
          type: geometryType,
          color: '#ccc',
          label: 'no data',
          width: opts.sizeRange[1]
        }
      ];
    }

    return legendProperties;
  };

  return new Style(evalFN, featureProperty, evalFNLegend, options.viewport);
}

async function getBreaks(
  opts: SizeBinsOptionsStyle,
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

async function calculateWithBreaks(
  featureProperty: string,
  breaks: number[],
  geometryType: GeometryType | undefined,
  options: SizeBinsOptionsStyle
) {
  const styles = getStyles(geometryType, options);

  // For 3 breaks, we create 4 ranges. For example: [30,80,120]
  // - From -inf to 29
  // - From 30 to 79
  // - From 80 to 119
  // - From 120 to +inf
  // Values lower than 0 will be in the first bucket and values higher than 120 will be in the last one.
  const ranges = [...breaks, Number.MAX_SAFE_INTEGER];

  // calculate sizes based on breaks and sizeRanges.
  const sizes = await calculateSizeBins(breaks.length, options.sizeRange);

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
    const featureValue: number = feature.properties[featureProperty];

    if (featureValue === null || featureValue === undefined) {
      return options.nullSize;
    }

    const featureValueIndex = findIndexForBinBuckets(ranges, featureValue);
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
      obj = { getLineWidth: getSizeValue };
    }
  } else {
    obj = {
      getLineWidth: getSizeValue,
      lineWidthMinPixels: minSize,
      lineWidthMaxPixels: maxSize,
      lineWidthUnits: 'pixels'
    };
  }

  return {
    ...styles,
    ...obj,
    updateTriggers: { getRadius: getSizeValue, getLineWidth: getSizeValue }
  };
}

function validateParameters(options: SizeBinsOptionsStyle, geometryType?: GeometryType) {
  if (geometryType === 'Polygon') {
    throw new CartoStylingError(
      "Polygon layer doesn't support sizeCategoriesStyle",
      stylingErrorTypes.GEOMETRY_TYPE_UNSUPPORTED
    );
  }

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
