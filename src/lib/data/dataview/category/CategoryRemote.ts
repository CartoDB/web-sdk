import { CategoryBase, CategoryOptions } from './CategoryBase';
import { DataViewRemote } from '../DataViewRemote';

const OPTION_CHANGED_DELAY = 250;

export class CategoryRemote extends CategoryBase<DataViewRemote> {
  /**
   * optionChanged timeout to prevent multiple
   * calls when user sets several options in a row
   */
  private optionChangedTimeoutId?: number;

  constructor(origin: DataViewRemote, options: CategoryOptions) {
    const events = ['dataChanged', 'optionChanged', 'error'];
    super(origin, options, events);

    this.on('optionChanged', () => {
      // timeout prevents multiple calls to getData
      // when user sets several options in a row
      if (this.optionChangedTimeoutId) {
        window.clearTimeout(this.optionChangedTimeoutId);
      }

      this.optionChangedTimeoutId = window.setTimeout(async () => {
        const newData = await this.getData();
        this.emit('dataChanged', [newData]);
      }, OPTION_CHANGED_DELAY);
    });
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
