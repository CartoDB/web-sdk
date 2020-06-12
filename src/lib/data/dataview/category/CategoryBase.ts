import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer } from '@/viz';
import { AggregationType } from '../../operations/aggregation/aggregation';
import { DataView } from '../dataview';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export abstract class CategoryBase<T extends DataView<Layer | string>> extends WithEvents {
  protected dataView: T;
  protected _operation: AggregationType;
  protected _operationColumn: string;
  protected _limit?: number;
  protected events: string[];

  constructor(dataView: T, options: CategoryOptions, events: string[] = ['optionChanged']) {
    super();

    this.dataView = dataView;

    const { operation, operationColumn, limit } = options || {};

    validateParameters(operation, operationColumn);

    this._operation = operation;
    this._operationColumn = operationColumn;
    this._limit = limit;

    this.events = [...events];

    if (!events.includes('optionChanged')) {
      events.push('optionChanged');
    }

    this.registerAvailableEvents(this.events);
  }

  public get operation() {
    return this._operation;
  }
  public set operation(operation: AggregationType) {
    this._operation = operation;
    this.emit('optionChanged');
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
  public set limit(limit: number) {
    this._limit = limit;
    this.emit('optionChanged');
  }

  public getEvents(): string[] {
    return this.events;
  }

  public abstract async getData(): Promise<CategoryData>;
}

function validateParameters(operation: AggregationType, operationColumn: string) {
  if (!operation) {
    throw new CartoDataViewError(
      'Operation property not provided while creating dataview. Please check documentation.',
      dataViewErrorTypes.PROPERTY_MISSING
    );
  }

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

export enum DataViewMode {
  SOURCE = 'source',
  VIEWPORT = 'viewport',
  MIXED = 'mixed'
}
