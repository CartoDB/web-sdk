import { GeoJsonLayerProps } from '@deck.gl/layers/geojson-layer/geojson-layer';
import { LegendProperties, LegendWidgetOptions } from '@/viz/legend';
import { IconLayerProps } from '@deck.gl/layers/icon-layer/icon-layer';
import { CartoStylingError, stylingErrorTypes } from '../errors/styling-error';
import { StyledLayer } from './layer-style';

export type StyleProperties =
  | (GeoJsonLayerProps<any> & IconLayerProps<any>)
  | ((layerStyle: StyledLayer) => Promise<GeoJsonLayerProps<any>> & Promise<IconLayerProps<any>>);

export type LegendPropertiesFunction = (
  layerStyle: StyledLayer,
  options: any
) => Promise<LegendProperties[]>;

export class Style {
  private _styleProperties: StyleProperties;
  private _field?: string;
  private _legendProperties?: LegendPropertiesFunction;
  private _viewport: boolean;

  constructor(
    styleProperties: StyleProperties,
    field?: string,
    legendProperties?: LegendPropertiesFunction,
    viewport = false
  ) {
    this._styleProperties = styleProperties;
    this._field = field;
    this._legendProperties = legendProperties;
    this._viewport = viewport;
  }

  public async getLayerProps(layerStyle?: StyledLayer) {
    if (typeof this._styleProperties === 'function') {
      if (layerStyle === undefined) {
        throw new CartoStylingError(
          'No layer instance when calling styles function',
          stylingErrorTypes.SOURCE_INSTANCE_MISSING
        );
      }

      const styleProperties = await this._styleProperties(layerStyle);
      return styleProperties;
    }

    return this._styleProperties;
  }

  public get field() {
    return this._field;
  }

  public get viewport() {
    return this._viewport;
  }

  public getLegendProps(layerStyle: StyledLayer, options: LegendWidgetOptions = { config: {} }) {
    if (this._legendProperties) {
      return this._legendProperties(layerStyle, options);
    }

    return undefined;
  }
}
