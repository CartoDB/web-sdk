import { Layer, Source } from '@/viz';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewModeAlias } from '../mode/DataViewModeBase';
import { DataViewWrapperBase } from '../DataViewWrapperBase';
import { CategoryOptions, CategoryImpl } from './CategoryImpl';

export class Category extends DataViewWrapperBase {
  protected buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: CategoryOptions,
    mode: DataViewModeAlias
  ) {
    let dataView;

    switch (mode) {
      case DataViewModeAlias.LOCAL: {
        dataView = new DataViewLocal(dataSource as Layer, column);
        break;
      }

      case DataViewModeAlias.REMOTE: {
        dataView = new DataViewRemote(dataSource as Source, column);
        break;
      }

      default: {
        dataView = new DataViewRemote(dataSource as Source, column);
        break;
      }
    }

    this.dataviewImpl = new CategoryImpl(dataView, options);
  }

  public get operationColumn() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewImpl as CategoryImpl<any>).operationColumn;
  }
  public set operationColumn(operationColumn: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewImpl as CategoryImpl<any>).operationColumn = operationColumn;
    this.emit('optionChanged');
  }

  public get limit() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewImpl as CategoryImpl<any>).limit;
  }

  public set limit(limit: number | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.dataviewImpl as CategoryImpl<any>).limit = limit;
    this.emit('optionChanged');
  }
}
