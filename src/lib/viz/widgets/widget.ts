import { DataViewMode } from '@/data/dataview/DataViewMode';
import { CartoError } from '@/core/errors/CartoError';
import { uuidv4 } from '@/core/utils/uuid';
import { queryDOMElement } from '../utils/dom';
import { Filterable } from '../filters/Filterable';

export abstract class Widget<T extends Filterable> {
  protected element: HTMLElement;
  protected dataView: DataViewMode<T>;
  protected widgetUUID: string = uuidv4();

  constructor(element: string | HTMLElement, dataView: DataView<T>) {
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

function validateParameters(element: HTMLElement | null, dataView: DataView<any>) {
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
