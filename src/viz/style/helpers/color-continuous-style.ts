import { NumericFieldStats, GeometryType } from '@/viz/source';
import { LegendProperties, LegendGeometryType, LegendWidgetOptions } from '@/viz/legend';
import { scale as chromaScale } from 'chroma-js';
import { getColors, getUpdateTriggers, hexToRgb } from './utils';
import { StyledLayer } from '../layer-style';
import { BasicOptionsStyle, getStyleValue, getStyles, Style } from '..';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { colorValidation } from '../validators';
import { ColorProperty, isColorProperty } from './properties-by-helper';

const DEFAULT_PALETTE = 'BluYl';

export interface ColorContinuousOptionsStyle extends Partial<BasicOptionsStyle> {
  // The minimum value of the data range for the continuous color ramp. Defaults to the globalMIN of the dataset.
  rangeMin?: number;
  // The maximum value of the data range for the continuous color ramp. Defaults to the globalMAX of the dataset.
  rangeMax?: number;
  // Palette that can be a named cartocolor palette or other valid color palette.
  palette: string[] | string;
  // Color applied to features which the attribute value is null.
  nullColor: string;
  // Styling property.
  property?: ColorProperty;
}

function defaultOptions(
  geometryType: GeometryType | undefined,
  options: Partial<ColorContinuousOptionsStyle>
): ColorContinuousOptionsStyle {
  return {
    strokeWidth: getDefaultStrokeWidth(geometryType, options),
    size: 6,
    palette: DEFAULT_PALETTE,
    nullColor: getStyleValue('nullColor', geometryType, options),
    ...options
  };
}

export function colorContinuousStyle(
  featureProperty: string,
  options: Partial<ColorContinuousOptionsStyle> = {}
) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();

    if (layer.source.isEmpty()) {
      return {};
    }

    const opts = defaultOptions(meta.geometryType, options);

    validateParameters(opts);

    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;

    if (stats.min === undefined || stats.max === undefined) {
      throw new Error('Need max/min');
    }

    return calculate(
      featureProperty,
      meta.geometryType,
      opts,
      getRangeMin(stats, opts),
      getRangeMax(stats, opts)
    );
  };

  const evalFNLegend = (
    layer: StyledLayer,
    legendWidgetOptions: LegendWidgetOptions = {}
  ): LegendProperties[] => {
    const meta = layer.source.getMetadata();

    if (!meta.geometryType) {
      return [];
    }

    const { format, config } = legendWidgetOptions;
    const opts = defaultOptions(meta.geometryType, options);
    const colors = getColors(opts.palette);
    const stats = meta.stats.find(f => f.name === featureProperty) as NumericFieldStats;
    const styles = getStyles(meta.geometryType, opts) as any;
    const rangeMin = getRangeMin(stats, opts);
    const rangeMax = getRangeMax(stats, opts);
    const colorScale = chromaScale(colors).domain([rangeMin, rangeMax]).mode('lrgb');
    const geometryType = meta.geometryType.toLocaleLowerCase() as LegendGeometryType;
    const samples = config?.samples || 10;
    const INC = 1 / (samples - 1);
    const result = [] as LegendProperties[];

    for (let i = 0; result.length < samples; i += INC) {
      const value = result.length === samples - 1 ? rangeMax : i * (rangeMax - rangeMin) + rangeMin;
      result.push({
        type: geometryType,
        color: `rgba(${colorScale(value).rgb().join(',')})`,
        label: format ? format(value) : value,
        width: styles.getSize,
        strokeColor:
          geometryType !== 'line' && options.property !== 'strokeColor'
            ? `rgba(${styles.getLineColor.join(',')})`
            : undefined
      });
    }

    return config?.order === 'ASC' ? result : result.reverse();
  };

  return new Style(evalFN, featureProperty, evalFNLegend);
}

function getRangeMin(stats: NumericFieldStats, opts: ColorContinuousOptionsStyle) {
  return opts.rangeMin === undefined ? stats.min : opts.rangeMin;
}

function getRangeMax(stats: NumericFieldStats, opts: ColorContinuousOptionsStyle) {
  return opts.rangeMax === undefined ? stats.max : opts.rangeMax;
}

function calculate(
  featureProperty: string,
  geometryType: GeometryType | undefined,
  options: ColorContinuousOptionsStyle,
  rangeMin: number,
  rangeMax: number
) {
  const styles = getStyles(geometryType, options);
  const colors = getColors(options.palette);
  const nullColor = hexToRgb(options.nullColor);

  const colorScale = chromaScale(colors).domain([rangeMin, rangeMax]).mode('lrgb');

  const getFillColor = (feature: Record<string, Record<string, number | string>>) => {
    const featureValue = Number(feature.properties[featureProperty]);

    if (!featureValue) {
      return nullColor;
    }

    return colorScale(featureValue).rgb();
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

function validateParameters(options: ColorContinuousOptionsStyle) {
  if (options.rangeMin && options.rangeMax && options.rangeMin >= options.rangeMax) {
    throw new CartoStylingError(
      'rangeMax should be greater than rangeMin',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.nullColor && !colorValidation(options.nullColor)) {
    throw new CartoStylingError(
      `nullColor '${options.color}' is not valid`,
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

function getDefaultStrokeWidth(
  geometryType: GeometryType | undefined,
  options: Partial<ColorContinuousOptionsStyle>
) {
  if (geometryType === 'Point') {
    return options.strokeWidth || 0;
  }

  return getStyleValue('strokeWidth', geometryType, options);
}
