import { Layer, Source } from '@/viz';
import { BuiltInFilters } from '@/viz/filters/types';
import { uuidv4 } from '@/core/utils/uuid';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewCalculation } from '../mode/DataViewMode';
import { DataViewWrapper, OPTION_CHANGED_DELAY, getCredentialsFrom } from '../DataViewWrapper';
import { CategoryOptions, CategoryDataViewImpl } from './CategoryDataViewImpl';
import { debounce, isGeoJSONSource } from '../utils';

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
        if (isGeoJSONSource(dataSource)) {
          const useViewport = false;
          dataView = new DataViewLocal(dataSource as Layer, column, useViewport);
          break;
        }

        const credentials = getCredentialsFrom(dataSource);
        dataView = new DataViewRemote(dataSource, column, credentials);
        break;
      }

      case DataViewCalculation.REMOTE_FILTERED:

      // eslint-disable-next-line no-fallthrough
      default: {
        if (isGeoJSONSource(dataSource)) {
          dataView = new DataViewLocal(dataSource as Layer, column);
          break;
        }

        const credentials = getCredentialsFrom(dataSource);
        dataView = new DataViewRemote(dataSource, column, credentials);
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
