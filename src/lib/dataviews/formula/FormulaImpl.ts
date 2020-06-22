import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewData, DataViewMode } from '../mode/DataViewMode';
import { DataViewImpl } from '../DataViewImpl';

export class FormulaImpl<T extends DataViewMode> extends DataViewImpl<T> {
  public async getData(): Promise<Partial<DataViewData>> {
    let formulaResponse;

    try {
      formulaResponse = await this.dataView.formula(this.operation);
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }

    return formulaResponse;
  }
}

export interface FormulaDataViewOptions {
  operation: AggregationType;
}
