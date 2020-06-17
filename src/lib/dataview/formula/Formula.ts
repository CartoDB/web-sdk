import { Layer, Source } from '@/viz';
import { DataViewModeAlias } from '../mode/DataViewModeBase';
import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { FormulaLocal } from './FormulaLocal';
import { FormulaRemote } from './FormulaRemote';
import { DataViewWrapperBase } from '../DataViewWrapperBase';

export class Formula extends DataViewWrapperBase {
  protected buildWrappee(
    dataSource: Layer | Source,
    column: string,
    options: FormulaDataViewOptions,
    mode: DataViewModeAlias
  ) {
    switch (mode) {
      case DataViewModeAlias.NON_PRECISE: {
        const dataViewLocal = new DataViewLocal(dataSource as Layer, column);
        this.dataviewWrappee = new FormulaLocal(dataViewLocal, options);
        break;
      }

      case DataViewModeAlias.VIEWPORT: {
        const dataViewRemote = new DataViewRemote(dataSource as Source, column);
        this.dataviewWrappee = new FormulaRemote(dataViewRemote, options);
        break;
      }

      default: {
        const dataViewRemote = new DataViewRemote(dataSource as Source, column);
        this.dataviewWrappee = new FormulaRemote(dataViewRemote, options);
        break;
      }
    }
  }
}

interface FormulaDataViewOptions {
  operation: AggregationType;
  mode?: DataViewModeAlias;
}
