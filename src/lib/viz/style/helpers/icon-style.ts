import { IconLayer } from '@deck.gl/layers';
import { Feature, Point, MultiPoint } from 'geojson';
import { GeometryType } from '@/viz/source';
import { StyledLayer } from '../layer-style';
import { Style } from '..';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';
import { IconLayerProps } from '@deck.gl/layers/icon-layer/icon-layer';

export interface IconOptionsStyle {
  // icon width in pixels
  iconWidth: number;
  // icon height in pixels
  iconHeight: number;
  // horizontal position of icon anchor
  anchorX: number;
  // vertical position of icon anchor
  anchorY: number;
  // Icon size multiplier
  sizeScale: number;  
}

interface GetIconProps {
  url: string;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
}

interface StyleOptions {
  iconWidth: number;
  iconHeight: number;
  sizeScale: number;
  sizeUnits: string;
  anchorX?: number;
  anchorY?: number;
}

function defaultOptions(options: Partial<IconOptionsStyle>) {
  return {
    sizeScale: 1,
    sizeUnits: 'pixels',
    iconWidth: 10,
    iconHeight: 10,
    ...options
  };
}

function getStyles(icon: string, options: StyleOptions) {
  const getIconProps: GetIconProps = {
    url: icon,
    width: options.iconWidth,
    height: options.iconHeight
  };

  if (options.anchorX) {
    getIconProps.anchorX = options.anchorX;
  }

  if (options.anchorY) {
    getIconProps.anchorY = options.anchorY;
  }

  return {
    getIcon: () => getIconProps,
    getSize: options.iconHeight,
    sizeScale: options.sizeScale,
    sizeUnits: options.sizeUnits
  }
}

/**
 * Show a custom image in your map at given coordinates.
 * This only works with Point geometries
 * @param icon icon image local path or URL 
 * @param options Partial<IconOptionsStyle> options
 */
export function iconStyle(icon: string, options: Partial<IconOptionsStyle>) {
  const evalFN = (layer: StyledLayer) =>  {
    const meta = layer.source.getMetadata();
    const iconOptions = defaultOptions(options);

    validateParameters(iconOptions, meta.geometryType);

    const styles = getStyles(icon, iconOptions);

    const renderSubLayers = (props: any) => new IconLayer(props); 

    return {
      _isIconLayer: true,
      getPosition,
      renderSubLayers,
      ...styles
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

  if (!options.iconWidth || options.iconWidth < 1 || !options.iconHeight || options.iconHeight < 1) {
    throw new CartoStylingError(
      'iconWidth and iconHeight should be greater than 0',
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
