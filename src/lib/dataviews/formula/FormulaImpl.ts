import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewData, DataViewModeBase } from '../mode/DataViewModeBase';
import { DataViewImplBase } from '../DataViewImplBase';

export class FormulaImpl<T extends DataViewModeBase> extends DataViewImplBase<T> {
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
