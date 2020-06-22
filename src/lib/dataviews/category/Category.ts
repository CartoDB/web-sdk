import { Layer, Source } from '@/viz';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewModeAlias } from '../mode/DataViewMode';
import { DataViewWrapper, OPTION_CHANGED_DELAY } from '../DataViewWrapper';
import { CategoryOptions, CategoryImpl } from './CategoryImpl';
import { debounce } from '../utils';

export class Category extends DataViewWrapper {
  protected buildImpl(dataSource: Layer | Source, column: string, options: CategoryOptions) {
    let dataView;
    const { mode } = options;

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
    debounce(
      () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.dataviewImpl as CategoryImpl<any>).operationColumn = operationColumn;
        this.emit('dataUpdate');
      },
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )(operationColumn);
  }

  public get limit() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.dataviewImpl as CategoryImpl<any>).limit;
  }

  public set limit(limit: number | undefined) {
    debounce(
      () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.dataviewImpl as CategoryImpl<any>).limit = limit;
        this.emit('dataUpdate');
      },
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )(limit);
  }
}
