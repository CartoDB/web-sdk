import { AggregationType, aggregateValues } from '../../../data/operations/aggregation';
import { DataViewMode, DataViewCalculation } from '../mode/DataViewMode';
import { DataViewImpl, GetDataOptions } from '../DataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewLocal, CategoryElement } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewOptions } from '../DataView';

export class CategoryDataViewImpl extends DataViewImpl<CategoryDataViewData> {
  public operationColumn: string;
  public limit?: number;

  constructor(dataView: DataViewMode, options: CategoryOptions) {
    super(dataView, options);

    const { operationColumn, limit } = options || {};

    validateParameters(this.operation, operationColumn);

    this.operationColumn = operationColumn;
    this.limit = limit;
  }

  public async getLocalData(options: GetDataOptions = {}): Promise<CategoryDataViewData> {
    const dataviewLocal = this.dataView as DataViewLocal;

    let aggregationOptions;

    if (this.operation !== AggregationType.COUNT) {
      aggregationOptions = {
        dimension: [this.column],
        numeric: [
          {
            column: this.operationColumn,
            operations: [this.operation]
          }
        ]
      };
    }

    try {
      const { categories, nullCount } = await dataviewLocal.groupBy(
        this.operationColumn,
        this.operation,
        {
          ...options,
          aggregationOptions
        }
      );

      const categoryValues = categories.map(category => category.value);

      return {
        categories: Number.isInteger(this.limit as number)
          ? categories.splice(0, this.limit)
          : categories,
        count: categories.length,
        operation: this.operation,
        max: aggregateValues(categoryValues, AggregationType.MAX).result,
        min: aggregateValues(categoryValues, AggregationType.MIN).result,
        nullCount
      };
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }
  }

  public async getRemoteData(options: GetDataOptions): Promise<CategoryDataViewData> {
    const dataviewRemote = this.dataView as DataViewRemote;

    try {
      const filterApplicator = dataviewRemote.getFilterApplicator();
      const bbox = filterApplicator.getBbox();

      dataviewRemote.updateDataViewSource(options);

      const dataviewsApiResponse = await dataviewRemote.dataviewsApi.aggregation({
        column: this.column,
        aggregation: this.operation,
        aggregationColumn: this.operationColumn,
        categories: this.limit,
        bbox
      });

      if (
        dataviewsApiResponse.errors_with_context &&
        dataviewsApiResponse.errors_with_context.length > 0
      ) {
        const { message, type } = dataviewsApiResponse.errors_with_context[0];
        throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
      }

      const { categories, count, max, min, nulls } = dataviewsApiResponse;

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
        operation: this.operation
      };
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }
  }
}

function validateParameters(operation: AggregationType, operationColumn: string) {
  if (!operationColumn && operation !== AggregationType.COUNT) {
    throw new CartoDataViewError(
      'Operation column property not provided while creating dataview. Please check documentation.',
      dataViewErrorTypes.PROPERTY_MISSING
    );
  }
}

export interface CategoryDataViewData {
  categories: {
    name: string;
    value: number;
  }[];
  count: number;
  operation: AggregationType;
  max: number;
  min: number;
  nullCount: number;
}

export interface CategoryOptions extends DataViewOptions {
  limit?: number;
  operation: AggregationType;
  operationColumn: string;
  mode?: DataViewCalculation;
}

export interface CategoryData {
  categories: CategoryElement[];
  count: number;
  max: number;
  min: number;
  nullCount: number;
  operation: AggregationType;
}
