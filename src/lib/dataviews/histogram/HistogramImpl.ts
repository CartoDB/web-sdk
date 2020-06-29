import {
  DataViewMode,
  HistogramDataViewOptions,
  HistogramDataViewResult
} from '../mode/DataViewMode';
import { DataViewImpl } from '../DataViewImpl';
import { AggregationType } from '../../data/operations/aggregation/aggregation';

export class HistogramImpl<T extends DataViewMode> extends DataViewImpl<T> {
  options: HistogramDataViewOptions;

  constructor(dataView: T, options: HistogramDataViewOptions) {
    super(dataView, { operation: AggregationType.AVG });
    this.options = options;
  }

  public async getData(): Promise<HistogramDataViewResult> {
    try {
      return await this.dataView.histogram(this.options.bins, this.options.start, this.options.end);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}
