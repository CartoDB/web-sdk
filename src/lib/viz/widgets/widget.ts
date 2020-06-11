import { DataView } from '@/data/dataview/dataview';
import { CartoError } from '@/core/errors/CartoError';
import { queryDOMElement } from '../utils/dom';

export class Widget {
  protected element: HTMLElement;
  protected dataView: DataView;

  constructor(element: string | HTMLElement, dataView: DataView) {
    const domElement = queryDOMElement(element);
    validateParameters(domElement, dataView);

    this.element = domElement as HTMLElement;
    this.dataView = dataView;
  }

  protected bindEvents() {
    this.dataView.on('dataUpdate', () => this.updateData());
  }

  // eslint-disable-next-line class-methods-use-this
  protected updateData() {
    throw new CartoError({
      type: '[Widget]',
      message: 'Update data method is not implemented in this widget'
    });
  }
}

function validateParameters(element: HTMLElement | null, dataView: DataView) {
  if (!element) {
    throw new CartoError({
      type: '[Widget]',
      message: 'Element passed to Category Widget is not valid'
    });
  }

  if (!(dataView instanceof DataView)) {
    throw new CartoError({
      type: '[Widget]',
      message: 'DataView passed to Category Widget is not valid'
    });
  }
}
