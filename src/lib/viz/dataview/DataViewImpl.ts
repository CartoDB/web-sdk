import { WithEvents } from '@/core/mixins/WithEvents';
import { Filter, ColumnFilters, SpatialFilters } from '@/viz/filters/types';
import { DataViewMode } from './mode/DataViewMode';
import { AggregationType } from '../../data/operations/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';

export abstract class DataViewImpl<T> extends WithEvents {
  protected dataView: DataViewMode;
  protected containsAggregatedData = false;

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

  public getAggregationColumnName() {
    return `_cdb_${this.operation}__${this.column}`;
  }

  public addFilter(filterId: string, filter: Filter) {
    const filterOptions = {
      ...(this.containsAggregatedData ? { columnName: this.getAggregationColumnName() } : {})
    };

    this.dataView.addFilter(filterId, filter, filterOptions);
  }

  public removeFilter(filterId: string) {
    this.dataView.removeFilter(filterId);
  }

  public setFilters(filters: ColumnFilters) {
    this.dataView.setFilters(filters);
  }

  public setSpatialFilter(spatialFilter: SpatialFilters) {
    this.dataView.setSpatialFilter(spatialFilter);
  }

  private bindEvents() {
    const events = this.dataView.availableEvents;
    this.registerAvailableEvents(events);
    events.forEach((e: string) => this.dataView.on(e, (args: any[]) => this.emit(e, args)));
  }

  public abstract async getLocalData(options: GetDataOptions): Promise<T>;

  public abstract async getRemoteData(options: GetDataOptions): Promise<T>;
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

export type GetDataOptions = {
  excludedFilters?: string[];
  aggregationOptions?: {
    dimension?: string[];
    numeric?: { column: string; operations: string[] }[];
  };
};
