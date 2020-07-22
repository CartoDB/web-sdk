import { NumericFieldStats, GeometryType } from '@/viz/source';
import { scale as chromaScale } from 'chroma-js';
import { getColors, getUpdateTriggers, hexToRgb } from './utils';
import { StyledLayer } from '../layer-style';
import { BasicOptionsStyle, getStyleValue, getStyles, Style } from '..';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { colorValidation } from '../validators';
import { ColorsProperties, isColorProperty } from './properties-by-helper';

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
  property?: ColorsProperties;
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
      opts.rangeMin === undefined ? stats.min : opts.rangeMin,
      opts.rangeMax === undefined ? stats.max : opts.rangeMax
    );
  };

  return new Style(evalFN, featureProperty);
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
