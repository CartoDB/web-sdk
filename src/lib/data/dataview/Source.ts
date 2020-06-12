import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/core/Credentials';
import { DataView } from './dataview';
import { AggregationType } from '../operations/aggregation/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';

export class Source extends DataView<string> {
  protected dataviewsApi: DataviewsApi;

  protected _dataSource: string;

  constructor(dataSource: string, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    this._dataSource = dataSource;
    this.dataviewsApi = new DataviewsApi(dataSource, credentials);

    this.registerAvailableEvents(['dataChanged', 'optionChanged', 'error']);
  }

  public get dataSource() {
    return this._dataSource;
  }

  public set dataSource(newSource: string) {
    this.validateParameters(newSource, this.column);

    this._dataSource = newSource;
    this.emit('optionChanged');
  }

  public get column() {
    return this._column;
  }

  public set column(newColumn: string) {
    this.validateParameters(this._dataSource, newColumn);

    this._column = newColumn;
    this.emit('optionChanged');
  }

  public async aggregation(aggregationParams: {
    aggregation: AggregationType;
    operationColumn: string;
    limit: number;
  }) {
    const { aggregation, limit, operationColumn } = aggregationParams;

    const aggregationResponse = await this.dataviewsApi.aggregation({
      column: this.column,
      aggregation,
      operationColumn,
      limit
    });

    if (
      aggregationResponse.errors_with_context &&
      aggregationResponse.errors_with_context.length > 0
    ) {
      this.emit('error', aggregationResponse.errors_with_context);
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
}
