import { Layer, LayerEvent } from '@/viz/layer';
import { queryDOMElement } from '@/core/utils/dom';
import { CartoError } from '@/core/errors/CartoError';

export type LegendGeometryType = 'point' | 'line' | 'polygon';

export type LegendProperties = {
  type: LegendGeometryType;
  color?: string;
  marker?: string;
  strokeColor?: string;
  strokeStyle?: string;
  label?: string | number;
  width?: number;
};

export type LegendWidgetOptions = {
  format?: (value: string | number | undefined) => string | number;
  dynamic?: boolean;
  config: {
    othersLabel?: string;
    order?: 'ASC' | 'DESC';
    samples?: number;
  };
};

export class LegendWidget {
  constructor(element: string | HTMLElement, layer: Layer, options?: LegendWidgetOptions) {
    const domElement = queryDOMElement(element);
    validateParameters(domElement, layer, options);
    const legendWidget = domElement as any;

    if (layer.isReady()) {
      legendWidget.data = layer.getLegendData(options);
    } else {
      layer.on(LayerEvent.DATA_READY, () => {
        legendWidget.data = layer.getLegendData(options);
      });
    }
  }
}

function validateParameters(
  element: HTMLElement | null,
  layer: Layer,
  options: LegendWidgetOptions = { config: {} }
) {
  if (!element) {
    throw new CartoError({
      type: '[Legend]',
      message: 'Element passed to Legend is not valid'
    });
  }

  if (!(layer instanceof Layer)) {
    throw new CartoError({
      type: '[Legend]',
      message: 'Layer passed to Legend is not valid'
    });
  }

  if (options.format && typeof options.format !== 'function') {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, format must be a function`
    });
  }

  if (options.dynamic && typeof options.dynamic !== 'boolean') {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, dynamic must be a boolean`
    });
  }

  if (options.config && typeof options.config !== 'object') {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, config must be an object`
    });
  }

  if (
    options.config &&
    options.config.othersLabel &&
    typeof options.config.othersLabel !== 'string'
  ) {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, othersLabel must be a string`
    });
  }

  if (
    options.config &&
    options.config.order &&
    typeof options.config.order !== 'string' &&
    (options.config.order === 'ASC' || options.config.order === 'DESC')
  ) {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, order must be ASC or DESC`
    });
  }

  if (options.config && options.config.samples && typeof options.config.samples !== 'number') {
    throw new CartoError({
      type: '[Legend]',
      message: `Options passed to Legend are not valid, samples must be a number`
    });
  }
}
