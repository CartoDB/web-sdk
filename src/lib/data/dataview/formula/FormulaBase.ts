import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { AggregationType } from '../../operations/aggregation/aggregation';
import { DataView, DataViewData } from '../DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export abstract class FormulaBase<T extends DataView<Layer | Source>> extends WithEvents {
  protected dataView: T;
  protected _operation: AggregationType;
  protected events: string[];

  constructor(dataView: T, options: CategoryOptions, events: string[] = ['optionChanged']) {
    super();

    this.dataView = dataView;

    const { operation } = options || {};

    validateParameters(operation, this.dataView.column);

    this._operation = operation;

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

  public getEvents(): string[] {
    return this.events;
  }

  public abstract async getData(): Promise<Partial<DataViewData>>;
}

function validateParameters(operation: AggregationType, column: string) {
  if (!operation) {
    throw new CartoDataViewError(
      'Operation property not provided while creating dataview. Please check documentation.',
      dataViewErrorTypes.PROPERTY_MISSING
    );
  }

  if (!column) {
    throw new CartoDataViewError(
      'Column property not provided while creating dataview. Please check documentation.',
      dataViewErrorTypes.PROPERTY_MISSING
    );
  }
}

export enum DataViewMode {
  GLOBAL = 'global',
  VIEWPORT = 'viewport',
  NON_PRECISE = 'non-precise'
}
