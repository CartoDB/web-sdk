import { Layer, Source } from '@/viz';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewCalculation } from '../mode/DataViewMode';
import { DataView, OPTION_CHANGED_DELAY, getCredentialsFrom } from '../DataView';
import {
  CategoryOptions,
  CategoryDataViewImpl,
  CategoryDataViewData
} from './CategoryDataViewImpl';
import { debounce, isGeoJSONSource } from '../utils';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class CategoryDataView extends DataView<CategoryDataViewData> {
  protected buildImpl(dataSource: Layer | Source, column: string, options: CategoryOptions) {
    let dataView;
    const geoJSONSource = isGeoJSONSource(dataSource);

    if (this.mode === DataViewCalculation.FAST || geoJSONSource) {
      const useViewport = !(this.mode === DataViewCalculation.PRECISE && geoJSONSource);
      dataView = new DataViewLocal(dataSource as Layer, column, useViewport);
    } else if (this.mode === DataViewCalculation.PRECISE) {
      const credentials = getCredentialsFrom(dataSource);
      dataView = new DataViewRemote(dataSource, column, credentials);
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

    this.dataviewImpl = new CategoryDataViewImpl(dataView, options);
  }

  public get operationColumn() {
    return (this.dataviewImpl as CategoryDataViewImpl).operationColumn;
  }

  public set operationColumn(operationColumn: string) {
    (this.dataviewImpl as CategoryDataViewImpl).operationColumn = operationColumn;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }

  public get limit() {
    return (this.dataviewImpl as CategoryDataViewImpl).limit;
  }

  public set limit(limit: number | undefined) {
    (this.dataviewImpl as CategoryDataViewImpl).limit = limit;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }
}
