import { Layer, Source } from '@/viz';
import { DataViewModeAlias } from '../DataViewMode';
import { AggregationType } from '../../operations/aggregation/aggregation';
import { DataViewLocal } from '../DataViewLocal';
import { DataViewRemote } from '../DataViewRemote';
import { FormulaLocal } from './FormulaLocal';
import { FormulaRemote } from './FormulaRemote';
import { DataViewWrapper } from '../DataViewWrapper';

export class FormulaDataView extends DataViewWrapper {
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
