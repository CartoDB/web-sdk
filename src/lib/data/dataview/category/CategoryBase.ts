import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { AggregationType } from '../../operations/aggregation/aggregation';
import { DataViewMode } from '../DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewBase } from '../DataViewBase';

export abstract class CategoryBase<T extends DataViewMode<Layer | Source>> extends DataViewBase<T> {
  protected _operationColumn: string;
  protected _limit?: number;

  constructor(dataView: T, options: CategoryOptions, events: string[] = ['optionChanged']) {
    super(dataView, options, events);

    const { operationColumn, limit } = options || {};

    validateParameters(this._operation, operationColumn);

    this._operationColumn = operationColumn;
    this._limit = limit;
  }

  public get operationColumn() {
    return this._operationColumn;
  }
  public set operationColumn(operationColumn: string) {
    this._operationColumn = operationColumn;
    this.emit('optionChanged');
  }

  public get limit() {
    return this._limit;
  }
  public set limit(limit: number | undefined) {
    this._limit = limit;
    this.emit('optionChanged');
  }
}

export interface CategoryOptions {
  limit?: number;
  operation: AggregationType;
  operationColumn: string;
  mode?: DataViewMode;
}

export interface CategoryData {
  categories: { name: string; value: number }[];
  count: number;
  max: number;
  min: number;
  nullCount: number;
  operation: AggregationType;
}
