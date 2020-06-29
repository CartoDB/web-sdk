import { Layer } from '@/viz';
import { Source } from '@/source';
import { BuiltInFilters } from '@/viz/filters/types';
import { uuidv4 } from '@/core/utils/uuid';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewCalculation } from '../mode/DataViewMode';
import { DataViewWrapper, OPTION_CHANGED_DELAY } from '../DataViewWrapper';
import { CategoryOptions, CategoryDataViewImpl } from './CategoryDataViewImpl';
import { debounce } from '../utils';

export class CategoryDataView extends DataViewWrapper {
  protected buildImpl(dataSource: Layer | Source, column: string, options: CategoryOptions) {
    let dataView;
    const { mode } = options;

    switch (mode) {
      case DataViewCalculation.LOCAL: {
        dataView = new DataViewLocal(dataSource as Layer, column);
        break;
      }

      case DataViewCalculation.REMOTE: {
        dataView = new DataViewRemote(dataSource, column);
        break;
      }

      default: {
        dataView = new DataViewRemote(dataSource, column);
        dataView.addFilter(`VIEWPORT_FILTER_${uuidv4()}`, BuiltInFilters.VIEWPORT);
        break;
      }
    }

    this.dataviewImpl = new CategoryDataViewImpl(dataView, options);
  }

  public get operationColumn() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewImpl as CategoryDataViewImpl<any>).operationColumn;
  }
  public set operationColumn(operationColumn: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewImpl as CategoryDataViewImpl<any>).operationColumn = operationColumn;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }

  public get limit() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewImpl as CategoryDataViewImpl<any>).limit;
  }

  public set limit(limit: number | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewImpl as CategoryDataViewImpl<any>).limit = limit;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }
}
