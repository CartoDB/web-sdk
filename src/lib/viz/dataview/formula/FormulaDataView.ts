import { DataViewCalculation } from '../mode/DataViewMode';
import { AggregationType } from '../../../data/operations/aggregation/aggregation';
import { DataView, DataViewOptions } from '../DataView';
import { FormulaDataViewImpl, FormulaDataViewData } from './FormulaDataViewImpl';

export class FormulaDataView extends DataView<FormulaDataViewData> {
  protected buildImpl(column: string, options: FormulaDataViewOptions) {
    const dataViewMode = this.createDataViewMode(column, options);
    this.dataviewImpl = new FormulaDataViewImpl(dataViewMode, options);
  }
}

interface FormulaDataViewOptions extends DataViewOptions {
  operation: AggregationType;
  mode?: DataViewCalculation;
}
