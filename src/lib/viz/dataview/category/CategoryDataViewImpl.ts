import { AggregationType } from '../../../data/operations/aggregation/aggregation';
import { DataViewMode, DataViewCalculation, DataViewData } from '../mode/DataViewMode';
import { DataViewImpl } from '../DataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class CategoryDataViewImpl<T extends DataViewMode> extends DataViewImpl<T> {
  public operationColumn: string;
  public limit?: number;

  constructor(dataView: T, options: CategoryOptions) {
    super(dataView, options);

    const { operationColumn, limit } = options || {};

    validateParameters(this.operation, operationColumn);

    this.operationColumn = operationColumn;
    this.limit = limit;
  }

  public async getData(): Promise<Partial<DataViewData>> {
    let aggregationResponse;

    try {
      aggregationResponse = await this.dataView.aggregation({
        aggregation: this.operation,
        operationColumn: this.operationColumn,
        limit: this.limit
      });
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }

    return aggregationResponse;
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

export interface CategoryOptions {
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

export interface CategoryElement {
  name: string;
  value: number;
}
