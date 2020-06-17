import { DataViewRemote } from '../mode/DataViewRemote';
import { FormulaBase, FormulaDataViewOptions } from './FormulaBase';

export class FormulaRemote extends FormulaBase<DataViewRemote> {
  constructor(origin: DataViewRemote, options: FormulaDataViewOptions) {
    const events = ['error'];
    super(origin, options, events);
  }

  public async getData() {
    let aggregationResponse;

    try {
      aggregationResponse = await this.dataView.formula(this.operation);
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }

    return aggregationResponse;
  }
}
