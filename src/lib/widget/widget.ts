import { CartoError } from '@/core/errors/CartoError';
import { uuidv4 } from '@/core/utils/uuid';
import { DataViewWrapperBase } from '@/dataview/DataViewWrapperBase';
import { queryDOMElement } from '../viz/utils/dom';

export abstract class Widget {
  protected element: HTMLElement;
  protected dataView: DataViewWrapperBase;
  protected widgetUUID: string = uuidv4();

  constructor(element: string | HTMLElement, dataView: DataViewWrapperBase) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateParameters(element: HTMLElement | null, dataView: DataViewWrapperBase) {
  if (!element) {
    throw new CartoError({
      type: '[Widget]',
      message: 'Element passed to Category Widget is not valid'
    });
  }

  if (!(dataView instanceof DataViewWrapperBase)) {
    throw new CartoError({
      type: '[Widget]',
      message: 'DataView passed to Category Widget is not valid'
    });
  }
}
