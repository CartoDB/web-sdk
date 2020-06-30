import { Layer, Source } from '@/viz';
import { BuiltInFilters } from '@/viz/filters/types';
import { uuidv4 } from '@/core/utils/uuid';
import { isGeoJSONSource } from '@/viz/utils/check';
import { DataViewCalculation, HistogramDataViewOptions } from '../mode/DataViewMode';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewWrapper } from '../DataViewWrapper';
import { HistogramImpl } from './HistogramImpl';

export class HistogramDataView extends DataViewWrapper {
  protected buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: HistogramDataViewOptions = { bins: 10 }
  ) {
    const { mode } = options;

    const dataViewCreationFn =
      createDataView[mode as DataViewCalculation] ||
      createDataView[DataViewCalculation.REMOTE_FILTERED];
    const dataView = dataViewCreationFn(dataSource, column);

    this.dataviewImpl = new HistogramImpl(dataView, options);
  }
}

const createDataView = {
  [DataViewCalculation.LOCAL](dataSource: Layer | Source, column: string) {
    return new DataViewLocal(dataSource as Layer, column);
  },

  [DataViewCalculation.REMOTE](dataSource: Layer | Source, column: string) {
    if (isGeoJSONSource(dataSource)) {
      const useViewport = false;
      return new DataViewLocal(dataSource as Layer, column, useViewport);
    }

    return new DataViewRemote(dataSource as Source, column);
  },

  [DataViewCalculation.REMOTE_FILTERED](dataSource: Layer | Source, column: string) {
    const dataView = new DataViewRemote(dataSource as Layer, column);
    dataView.addFilter(`VIEWPORT_FILTER_${uuidv4()}`, BuiltInFilters.VIEWPORT);
    return dataView;
  }
};
