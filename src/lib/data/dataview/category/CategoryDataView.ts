import { Layer, Source } from '@/viz';
import { spatialFilter } from '@/viz/filters/spatial-filters';
import { DataViewLocal } from '../DataViewLocal';
import { DataViewRemote } from '../DataViewRemote';
import { CategoryLocal } from './CategoryLocal';
import { CategoryRemote } from './CategoryRemote';
import { DataViewModeAlias } from '../DataViewMode';
import { DataViewWrapper } from '../DataViewWrapper';
import { CategoryOptions, CategoryBase } from './CategoryBase';

export class CategoryDataView extends DataViewWrapper {
  protected buildWrappee(
    dataSource: Layer | Source,
    column: string,
    options: CategoryOptions,
    mode: DataViewModeAlias
  ) {
    switch (mode) {
      case DataViewModeAlias.NON_PRECISE: {
        const dataViewLocal = new DataViewLocal(dataSource as Layer, column);
        this.dataviewWrappee = new CategoryLocal(dataViewLocal, options);
        break;
      }

      case DataViewModeAlias.VIEWPORT: {
        const dataViewRemote = new DataViewRemote(dataSource as Source, column);
        dataViewRemote.addFilter(column, spatialFilter.VIEWPORT);
        this.dataviewWrappee = new CategoryRemote(dataViewRemote, options);
        break;
      }

      default: {
        const dataViewRemote = new DataViewRemote(dataSource as Source, column);
        this.dataviewWrappee = new CategoryRemote(dataViewRemote, options);
        break;
      }
    }
  }

  public get operationColumn() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewWrappee as CategoryBase<any>).operationColumn;
  }
  public set operationColumn(operationColumn: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewWrappee as CategoryBase<any>).operationColumn = operationColumn;
    this.emit('optionChanged');
  }

  public get limit() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewWrappee as CategoryBase<any>).limit;
  }

  public set limit(limit: number | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewWrappee as CategoryBase<any>).limit = limit;
    this.emit('optionChanged');
  }
}
