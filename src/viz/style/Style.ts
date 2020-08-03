import { GeoJsonLayerProps } from '@deck.gl/layers/geojson-layer/geojson-layer';
import { LegendProperties, LegendWidgetOptions } from '@/viz/legend';
import { IconLayerProps } from '@deck.gl/layers/icon-layer/icon-layer';
import { CartoStylingError, stylingErrorTypes } from '../errors/styling-error';
import { StyledLayer } from './layer-style';

export type StyleProperties =
  | (GeoJsonLayerProps<any> & IconLayerProps<any>)
  | ((layerStyle: StyledLayer) => GeoJsonLayerProps<any> & IconLayerProps<any>);

type LegendPropertiesFunction = (layerStyle: StyledLayer, options: any) => LegendProperties[];

export class Style {
  private _styleProperties: StyleProperties;
  private _field?: string;
  private _legendProperties?: LegendPropertiesFunction;

  constructor(
    styleProperties: StyleProperties,
    field?: string,
    legendProperties?: LegendPropertiesFunction
  ) {
    this._styleProperties = styleProperties;
    this._field = field;
    this._legendProperties = legendProperties;
  }

  public getLayerProps(layerStyle?: StyledLayer) {
    if (typeof this._styleProperties === 'function') {
      if (layerStyle === undefined) {
        throw new CartoStylingError(
          'No layer instance when calling styles function',
          stylingErrorTypes.SOURCE_INSTANCE_MISSING
        );
      }

      return this._styleProperties(layerStyle);
    }

    return this._styleProperties;
  }

  public get field() {
    return this._field;
  }

  public getLegendProps(layerStyle: StyledLayer, options: LegendWidgetOptions = { config: {} }) {
    if (this._legendProperties) {
      return this._legendProperties(layerStyle, options);
    }

    return undefined;
  }
}
