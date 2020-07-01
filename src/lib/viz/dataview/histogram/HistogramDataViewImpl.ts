import { isVariableDefined } from '@/core/utils/variables';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import {
  DataViewMode,
  HistogramDataViewOptions,
  HistogramDataViewData
} from '../mode/DataViewMode';
import { DataViewImpl } from '../DataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class HistogramDataViewImpl<T extends DataViewMode> extends DataViewImpl<T> {
  options: HistogramDataViewOptions;

  constructor(dataView: T, options: HistogramDataViewOptions) {
    super(dataView, { operation: AggregationType.COUNT });

    const { bins, start, end } = options;
    validateParameters(bins, start, end);

    this.options = options;
  }

  public async getData(): Promise<HistogramDataViewData> {
    const { bins = 10, start, end } = this.options;

    try {
      return await this.dataView.histogram(bins, start, end);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

function validateParameters(
  bins: number | undefined,
  start: number | undefined = 0,
  end: number | undefined = 0
) {
  if (bins && !Number.isInteger(bins)) {
    throw new CartoDataViewError(
      'Bins property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(start) && !Number.isInteger(start)) {
    throw new CartoDataViewError(
      'Start property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(end) && !Number.isInteger(end)) {
    throw new CartoDataViewError(
      'End property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(start) && isVariableDefined(end) && start > end) {
    throw new CartoDataViewError(
      'Start should be greater than end. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }
}
