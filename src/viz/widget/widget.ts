import { CartoError } from '@/core/errors/CartoError';
import { uuidv4 } from '@/core/utils/uuid';
import { DataView } from '@/viz/dataview/DataView';
import { queryDOMElement } from '@/core/utils/dom';
import { DataViewEvent } from '@/viz/dataview/utils';

export abstract class Widget<T> {
  protected element: HTMLElement;
  protected dataView: DataView<T>;
  protected widgetUUID: string = uuidv4();

  constructor(element: string | HTMLElement, dataView: DataView<T>) {
    const domElement = queryDOMElement(element);
    validateParameters(domElement, dataView);

    this.element = domElement as HTMLElement;
    this.dataView = dataView;
  }

  protected bindEvents() {
    this.dataView.on(DataViewEvent.DATA_UPDATE, () => this.updateData());
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
function validateParameters(element: HTMLElement | null, dataView: DataView<unknown>) {
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
