import { Layer, Source } from '@/viz';
import { DataViewModeAlias } from '../mode/DataViewMode';
import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewWrapper } from '../DataViewWrapper';
import { FormulaImpl } from './FormulaImpl';

export class Formula extends DataViewWrapper {
  protected buildImpl(dataSource: Layer | Source, column: string, options: FormulaDataViewOptions) {
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

    this.dataviewImpl = new FormulaImpl(dataView, options);
  }
}

interface FormulaDataViewOptions {
  operation: AggregationType;
  mode?: DataViewModeAlias;
}
