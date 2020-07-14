import { IconLayer } from '@deck.gl/layers';
import { Feature, Point, MultiPoint } from 'geojson';
import { GeometryType } from '@/viz/source';
import { StyledLayer } from '../layer-style';
import { Style, getStyles } from '..';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';

export interface IconOptionsStyle {
  // icon width in pixels
  width: number;
  // icon height in pixels
  height: number;
  // horizontal position of icon anchor
  anchorX: number;
  // vertical position of icon anchor
  anchorY: number;
  // Icon size multiplier
  sizeScale: number;
}

interface IconOptionsStyleValidated {
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  sizeScale?: number;
}

function getIconStyles(icon: string, options: IconOptionsStyleValidated) {
  const getIconProps = {
    url: icon,
    width: options.width,
    height: options.height,
    anchorX: options.anchorX || options.width / 2,
    anchorY: options.anchorY || options.height / 2
  };

  return {
    getIcon: () => getIconProps,
    getSize: options.height,
    sizeScale: options.sizeScale,
    sizeUnits: 'pixels'
  };
}

function defaultOptions(options: Partial<IconOptionsStyle>) {
  return {
    sizeScale: 1,
    width: 20,
    height: 20,
    ...options
  };
}

export function iconStyle(icon: string, options: Partial<IconOptionsStyle> = {}) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();
    const iconOptions = defaultOptions(options);

    validateParameters(iconOptions, meta.geometryType);

    const iconStyles = getIconStyles(icon, iconOptions);
    const pointStyles = getStyles(meta.geometryType, {});

    return {
      _isIconLayer: true,
      getPosition,
      renderSubLayers,
      ...pointStyles,
      ...iconStyles
    };
  };

  return new Style(evalFN);
}

function validateParameters(options: Partial<IconOptionsStyle>, geometryType: GeometryType) {
  if (geometryType !== 'Point') {
    throw new CartoStylingError(
      'Only Points layers support iconStyle',
      stylingErrorTypes.GEOMETRY_TYPE_UNSUPPORTED
    );
  }

  if (options.sizeScale && options.sizeScale < 0) {
    throw new CartoStylingError(
      'sizeScale must be equal or greater than 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.sizeScale && options.sizeScale < 0) {
    throw new CartoStylingError(
      'sizeScale must be equal or greater than 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (!options.width || options.width < 1 || !options.height || options.height < 1) {
    throw new CartoStylingError(
      'width and height should be greater than 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.anchorX && options.anchorX < 0) {
    throw new CartoStylingError(
      'anchorX should be equal or greater than 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }

  if (options.anchorY && options.anchorY < 0) {
    throw new CartoStylingError(
      'anchorY should be equal or greater than 0',
      stylingErrorTypes.PROPERTY_MISMATCH
    );
  }
}

function getPosition(f: Feature<Point | MultiPoint>) {
  return f.geometry.coordinates;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSubLayers(props: any) {
  return new IconLayer(props);
}
