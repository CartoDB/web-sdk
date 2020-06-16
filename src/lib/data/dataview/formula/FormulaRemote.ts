import { DataViewRemote } from '../DataViewRemote';
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
      const { message } = error;
      this.emit('error', message);
      throw error;
    }

    return aggregationResponse;
  }
}
