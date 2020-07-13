import { Layer, Source } from '@/viz';
import { isGeoJSONSource } from '../utils';
import { DataViewCalculation } from '../mode/DataViewMode';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataView, getCredentialsFrom } from '../DataView';
import {
  HistogramDataViewImpl,
  HistogramDataViewOptions,
  HistogramDataViewData
} from './HistogramDataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class HistogramDataView extends DataView<HistogramDataViewData> {
  protected buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: HistogramDataViewOptions = { bins: 10 }
  ) {
    let dataView;
    const geoJSONSource = isGeoJSONSource(dataSource);

    if (this.mode === DataViewCalculation.FAST || geoJSONSource) {
      const useViewport = !(this.mode === DataViewCalculation.PRECISE && geoJSONSource);
      dataView = new DataViewLocal(dataSource as Layer, column, useViewport);
    } else if (this.mode === DataViewCalculation.PRECISE) {
      const credentials = getCredentialsFrom(dataSource);
      dataView = new DataViewRemote(dataSource as Layer, column, credentials);
    } else {
      throw new CartoDataViewError(
        `mode ${this.mode} unknown. Availables: '${DataViewCalculation.FAST}' and '${DataViewCalculation.PRECISE}'.`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    if (options.filters) {
      dataView.setFilters(options.filters);
    }

    if (options.spatialFilter) {
      dataView.setSpatialFilter(options.spatialFilter);
    }

    this.dataviewImpl = new HistogramDataViewImpl(dataView, options);
  }
}
