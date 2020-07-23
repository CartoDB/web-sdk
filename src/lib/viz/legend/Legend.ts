import { Layer } from '@/viz/layer';
import { queryDOMElement } from '@/core/utils/dom';
import { CartoError } from '@/core/errors/CartoError';

export type LegendProperties = {
  type: 'point' | 'line' | 'polygon';
  color?: string;
  marker?: string;
  strokeColor?: string;
  strokeStyle?: string;
  label: string;
  width: number;
};

export class Legend {
  constructor(element: string | HTMLElement, layer: Layer) {
    const domElement = queryDOMElement(element);
    // this._validateParameters(domElement, layer)

    const legendWidget = domElement as any;
    legendWidget.data = layer.getLegendData();
  }

  // private _validateParameters(element: HTMLElement | null, layer: Layer) {
  //   if (!element) {
  //     throw new CartoError({
  //       type: '[Legend]',
  //       message: 'Element passed to Legend is not valid'
  //     });
  //   }
  //
  //   if (!(layer instanceof Layer)) {
  //     throw new CartoError({
  //       type: '[Legend]',
  //       message: 'Layer passed to Legend is not valid'
  //     });
  //   }
  // }
}
