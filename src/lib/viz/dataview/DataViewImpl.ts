import { WithEvents } from '@/core/mixins/WithEvents';
import { Filter } from '@/viz/filters/types';
import { DataViewMode } from './mode/DataViewMode';
import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';

export abstract class DataViewImpl<T> extends WithEvents {
  protected dataView: DataViewMode;

  public operation: AggregationType;

  constructor(dataView: DataViewMode, options: { operation: AggregationType }) {
    super();

    this.dataView = dataView;

    const { operation } = options || {};

    validateParameters(operation, this.dataView.column);

    this.operation = operation;

    this.bindEvents();
  }

  public get column() {
    return this.dataView.column;
  }

  public set column(newColumn: string) {
    this.dataView.column = newColumn;
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataView.addFilter(filterId, filter);
  }

  public removeFilter(filterId: string) {
    this.dataView.removeFilter(filterId);
  }

  private bindEvents() {
    const events = this.dataView.availableEvents;
    this.registerAvailableEvents(events);
    events.forEach((e: string) => this.dataView.on(e, (args: any[]) => this.emit(e, args)));
  }

  public abstract async getLocalData(filterId?: string): Promise<T>;

  public abstract async getRemoteData(): Promise<T>;
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
