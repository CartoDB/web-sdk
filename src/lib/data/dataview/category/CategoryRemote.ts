import { CategoryBase, CategoryOptions } from './CategoryBase';
import { DataViewRemote } from '../DataViewRemote';

export class CategoryRemote extends CategoryBase<DataViewRemote> {
  constructor(origin: DataViewRemote, options: CategoryOptions) {
    const events = ['error'];
    super(origin, options, events);
  }

  public async getData() {
    let aggregationResponse;

    try {
      aggregationResponse = await this.dataView.aggregation({
        aggregation: this.operation,
        operationColumn: this.operationColumn,
        limit: this.limit
      });
    } catch (error) {
      const { message } = error;
      this.emit('error', message);
      throw error;
    }

    return aggregationResponse;
  }
}
