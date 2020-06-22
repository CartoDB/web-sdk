import { MapsDataviews as DataviewsApi, AggregationType } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/core/Credentials';
import { Source, CARTOSource, Layer } from '@/viz';
import { DataViewMode } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewMode {
  protected dataviewsApi: DataviewsApi;

  constructor(dataSource: Source, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    let source = dataSource;

    if (dataSource instanceof Layer) {
      source = dataSource.source;
    }

    if (!(source instanceof CARTOSource)) {
      throw new CartoDataViewError(
        'The provided source has to be an instance of CARTOSource',
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    const dataset = (dataSource as CARTOSource).value;
    this.dataviewsApi = new DataviewsApi(dataset, credentials);

    this.registerAvailableEvents(['error']);
  }

  public async aggregation(aggregationParams: {
    aggregation: AggregationType;
    operationColumn: string;
    limit?: number;
  }) {
    const { aggregation, limit, operationColumn } = aggregationParams;

    const aggregationResponse = await this.dataviewsApi.aggregation({
      column: this.column,
      aggregation,
      aggregationColumn: operationColumn,
      limit
    });

    if (
      aggregationResponse.errors_with_context &&
      aggregationResponse.errors_with_context.length > 0
    ) {
      const { message, type } = aggregationResponse.errors_with_context[0];
      throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
    }

    const { categories, count, max, min, nulls } = aggregationResponse;

    const adaptedCategories = categories.map(({ category, value }) => {
      return {
        name: category,
        value
      };
    });

    return {
      categories: adaptedCategories,
      count,
      max,
      min,
      nullCount: nulls,
      operation: aggregation
    };
  }

  public async formula(operation: AggregationType) {
    const formulaResponse = await this.dataviewsApi.formula({
      column: this.column,
      operation
    });

    if (formulaResponse.errors_with_context && formulaResponse.errors_with_context.length > 0) {
      const { message, type } = formulaResponse.errors_with_context[0];
      throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
    }

    const { result, nulls } = formulaResponse;

    return {
      result,
      operation,
      nullCount: nulls
    };
  }
}
