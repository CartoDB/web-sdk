import { Layer, Source } from '@/viz';
import { DataViewCalculation } from '../mode/DataViewMode';
import { AggregationType } from '../../../data/operations/aggregation/aggregation';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataView, getCredentialsFrom, DataViewOptions } from '../DataView';
import { FormulaDataViewImpl, FormulaDataViewData } from './FormulaDataViewImpl';
import { isGeoJSONSource } from '../utils';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class FormulaDataView extends DataView<FormulaDataViewData> {
  protected buildImpl(dataSource: Layer | Source, column: string, options: FormulaDataViewOptions) {
    let dataView;
    const geoJSONSource = isGeoJSONSource(dataSource);

    if (this.mode === DataViewCalculation.FAST || geoJSONSource) {
      const useViewport = !(this.mode === DataViewCalculation.PRECISE && geoJSONSource);
      dataView = new DataViewLocal(dataSource as Layer, column, useViewport);
    } else if (this.mode === DataViewCalculation.PRECISE) {
      const credentials = getCredentialsFrom(dataSource);
      dataView = new DataViewRemote(dataSource as Source, column, credentials);
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

    this.dataviewImpl = new FormulaDataViewImpl(dataView, options);
  }
}

interface FormulaDataViewOptions extends DataViewOptions {
  operation: AggregationType;
  mode?: DataViewCalculation;
}
