import { Texture2D } from '@luma.gl/core';
import { IconLayer } from '@deck.gl/layers';
import { StyledLayer } from '../layer-style';
import { Style, BasicOptionsStyle, getStyles } from '..';
import { GeometryType } from '../../sources/Source';
import { CartoStylingError, stylingErrorTypes } from '../../errors/styling-error';

export interface Icon {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  mask?: boolean;
}

export interface IconOptionsStyle extends Partial<BasicOptionsStyle> {
  // Atlas image url or texture
  iconAtlas: Texture2D | string;
  // Icon names mapped to icon definitions
  iconMapping: Record<string, Icon>;
  // Icon size multiplier
  sizeScale: number;
  // Method called to retrieve the icon name of each object
  // eslint-disable-next-line @typescript-eslint/ban-types
  getIcon: Function;
  // icon height in pixels
  size: number;
}

function defaultOptions(options: Partial<IconOptionsStyle>) {
  return {
    sizeScale: 1,
    size: 50,
    ...options
  };
}

export function iconStyle(options: Partial<IconOptionsStyle> = {}) {
  const evalFN = (layer: StyledLayer) => {
    const meta = layer.source.getMetadata();
    const iconOptions = defaultOptions(options);

    validateParameters(iconOptions, meta.geometryType);

    const pointStyles = getStyles(meta.geometryType, iconOptions);

    // eslint-disable-next-line @typescript-eslint/ban-types
    const renderSubLayers = (props: any) => new IconLayer(props);

    return {
      renderSubLayers,
      ...iconOptions,
      ...pointStyles
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

  if (options.iconMapping) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [iconName, icon] of Object.entries(options.iconMapping)) {
      if (icon.x < 0 || icon.y < 0) {
        throw new CartoStylingError(
          `x and y should be equal or greater than 0 (error in icon '${iconName}')`,
          stylingErrorTypes.PROPERTY_MISMATCH
        );
      }

      if (icon.width < 0 || icon.height < 0) {
        throw new CartoStylingError(
          `width and height should be equal or greater than 0 (error in icon '${iconName}')`,
          stylingErrorTypes.PROPERTY_MISMATCH
        );
      }

      if ((icon.anchorX && icon.anchorX < 0) || (icon.anchorY && icon.anchorY < 0)) {
        throw new CartoStylingError(
          `anchorX and anchorY should be equal or greater than 0 (error in icon '${iconName}')`,
          stylingErrorTypes.PROPERTY_MISMATCH
        );
      }
    }
  }
}
