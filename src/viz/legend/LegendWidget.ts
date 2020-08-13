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
  config?: {
    othersLabel?: string;
    order?: 'ASC' | 'DESC';
    samples?: number;
  };
};

export class LegendWidget {
  constructor(element: string | HTMLElement, layer: Layer, options: LegendWidgetOptions = {}) {
    const domElement = queryDOMElement(element);
    validateParameters(domElement, layer, options);
    const legendWidget = domElement as any;

    if (layer.isReady()) {
      layer.getStyle().then(style => {
        if (style.viewport) {
          layer.on(LayerEvent.TILES_LOADED, () => applyLegendData(legendWidget, layer, options));
        }
      });
      applyLegendData(legendWidget, layer, options);
    } else {
      layer.on(LayerEvent.DATA_READY, () => {
        layer.getStyle().then(style => {
          if (style.viewport) {
            layer.on(LayerEvent.TILES_LOADED, () => applyLegendData(legendWidget, layer, options));
          }
        });
        applyLegendData(legendWidget, layer, options);
      });
    }
  }
}

async function applyLegendData(
  legendWidget: { data: LegendProperties[] },
  layer: Layer,
  options: any
) {
  const legendData = await layer.getLegendData(options);

  if (legendData) {
    // eslint-disable-next-line no-param-reassign
    legendWidget.data = legendData;
  }
}

function validateParameters(
  element: HTMLElement | null,
  layer: Layer,
  options: LegendWidgetOptions
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
    (typeof options.config.order !== 'string' ||
      (options.config.order !== 'ASC' && options.config.order !== 'DESC'))
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
