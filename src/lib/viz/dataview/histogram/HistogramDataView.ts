import { Layer, Source } from '@/viz';
import { BuiltInFilters } from '@/viz/filters/types';
import { uuidv4 } from '@/core/utils/uuid';
import { isGeoJSONSource } from '../utils';
import { DataViewCalculation, HistogramDataViewOptions } from '../mode/DataViewMode';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewWrapper, getCredentialsFrom } from '../DataViewWrapper';
import { HistogramDataViewImpl } from './HistogramDataViewImpl';

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

    this.dataviewImpl = new HistogramDataViewImpl(dataView, options);
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

    const credentials = getCredentialsFrom(dataSource);
    return new DataViewRemote(dataSource as Source, column, credentials);
  },

  [DataViewCalculation.REMOTE_FILTERED](dataSource: Layer | Source, column: string) {
    if (isGeoJSONSource(dataSource)) {
      return new DataViewLocal(dataSource as Layer, column);
    }

    const credentials = getCredentialsFrom(dataSource);
    const dataView = new DataViewRemote(dataSource as Layer, column, credentials);
    dataView.addFilter(`VIEWPORT_FILTER_${uuidv4()}`, BuiltInFilters.VIEWPORT);
    return dataView;
  }
};
