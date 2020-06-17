import { Layer, Source } from '@/viz';
import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewModeBase, DataViewModeAlias } from '../mode/DataViewModeBase';
import { DataViewBase } from '../DataViewBase';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export abstract class CategoryBase<T extends DataViewModeBase<Layer | Source>> extends DataViewBase<
  T
> {
  public operationColumn: string;
  public limit?: number;

  constructor(dataView: T, options: CategoryOptions, events: string[] = ['optionChanged']) {
    super(dataView, options, events);

    const { operationColumn, limit } = options || {};

    validateParameters(operationColumn);

    this.operationColumn = operationColumn;
    this.limit = limit;
  }
}

function validateParameters(operationColumn: string) {
  if (!operationColumn) {
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
  mode?: DataViewModeAlias;
}

export interface CategoryData {
  categories: { name: string; value: number }[];
  count: number;
  max: number;
  min: number;
  nullCount: number;
  operation: AggregationType;
}
