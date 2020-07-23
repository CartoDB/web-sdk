import { DataView, OPTION_CHANGED_DELAY } from '../DataView';

import {
  CategoryOptions,
  CategoryDataViewImpl,
  CategoryDataViewData
} from './CategoryDataViewImpl';
import { debounce, DataViewEvent } from '../utils';

export class CategoryDataView extends DataView<CategoryDataViewData> {
  protected buildImpl(column: string, options: CategoryOptions) {
    const dataViewMode = this.createDataViewMode(column, options);
    this.dataviewImpl = new CategoryDataViewImpl(dataViewMode, options);
  }

  public get operationColumn() {
    return (this.dataviewImpl as CategoryDataViewImpl).operationColumn;
  }

  public set operationColumn(operationColumn: string) {
    (this.dataviewImpl as CategoryDataViewImpl).operationColumn = operationColumn;
    debounce(
      () => this.emit(DataViewEvent.DATA_UPDATE),
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )();
  }

  public get limit() {
    return (this.dataviewImpl as CategoryDataViewImpl).limit;
  }

  public set limit(limit: number | undefined) {
    (this.dataviewImpl as CategoryDataViewImpl).limit = limit;
    debounce(
      () => this.emit(DataViewEvent.DATA_UPDATE),
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )();
  }
}
