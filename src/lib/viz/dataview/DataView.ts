import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { Credentials } from '@/auth';
import { Filter, ColumnFilters, SpatialFilters } from '@/viz/filters/types';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { DataViewImpl } from './DataViewImpl';
import { DataViewCalculation, DataViewMode } from './mode/DataViewMode';
import { debounce, isGeoJSONSource } from './utils';
import { SQLSource, DatasetSource, DOSource } from '../source';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';
import { DataViewLocal } from './mode/DataViewLocal';
import { DataViewRemote } from './mode/DataViewRemote';

export const OPTION_CHANGED_DELAY = 100;

export abstract class DataView<T> extends WithEvents {
  protected mode: DataViewCalculation;
  protected dataviewImpl!: DataViewImpl<T>;
  protected dataSource: Layer | Source;

  /**
   * Debounce scope to prevent multiple calls
   * when options changed in a row
   */
  protected setOptionScope: { timeoutId?: number } = {};

  constructor(dataSource: Layer | Source, column: string, options: Record<string, unknown> = {}) {
    super();

    this.dataSource = dataSource;
    this.mode = (options.mode as DataViewCalculation) || DataViewCalculation.PRECISE;

    if (!options.mode && options.spatialFilter === 'viewport') {
      this.mode = DataViewCalculation.FAST;
    }

    this.buildImpl(column, options);

    // bind events with the mode
    this.bindEvents();
  }

  protected createDataViewMode(column: string, options: DataViewOptions): DataViewMode {
    let dataViewMode;

    if (this.mode === DataViewCalculation.FAST || isGeoJSONSource(this.dataSource)) {
      dataViewMode = new DataViewLocal(this.dataSource as Layer, column);
    } else if (this.mode === DataViewCalculation.PRECISE) {
      const credentials = getCredentialsFrom(this.dataSource);
      dataViewMode = new DataViewRemote(this.dataSource, column, credentials);
    } else {
      throw new CartoDataViewError(
        `mode ${this.mode} unknown. Availables: '${DataViewCalculation.FAST}' and '${DataViewCalculation.PRECISE}'.`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    if (options.filters) {
      dataViewMode.setFilters(options.filters);
    }

    if (options.spatialFilter) {
      dataViewMode.setSpatialFilter(options.spatialFilter);
    }

    return dataViewMode;
  }

  public getData(options: { excludedFilters?: string[] } = {}): Promise<T> {
    let data;
    const { excludedFilters = [] } = options;

    // GeoJSON has the features in local
    if (this.mode === DataViewCalculation.FAST || isGeoJSONSource(this.dataSource)) {
      data = this.dataviewImpl.getLocalData({ excludedFilters });
    } else if (this.mode === DataViewCalculation.PRECISE) {
      data = this.dataviewImpl.getRemoteData({ excludedFilters });
    } else {
      throw new CartoDataViewError(
        `mode ${this.mode} unknown. Availables: '${DataViewCalculation.FAST}' and '${DataViewCalculation.PRECISE}'.`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    return data;
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataviewImpl.addFilter(filterId, filter);
  }

  public removeFilter(filterId: string) {
    this.dataviewImpl.removeFilter(filterId);
  }

  public setFilters(filters: ColumnFilters) {
    this.dataviewImpl.setFilters(filters);
  }

  public setSpatialFilter(spatialFilter: SpatialFilters) {
    this.dataviewImpl.setSpatialFilter(spatialFilter);
  }

  public get column() {
    return this.dataviewImpl.column;
  }

  public set column(column: string) {
    this.dataviewImpl.column = column;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }

  public get operation() {
    return this.dataviewImpl.operation;
  }

  public set operation(operation: AggregationType) {
    this.dataviewImpl.operation = operation;
    debounce(() => this.emit('dataUpdate'), OPTION_CHANGED_DELAY, this.setOptionScope)();
  }

  private bindEvents() {
    const events = [...this.dataviewImpl.availableEvents];

    if (!events.includes('dataUpdate')) {
      events.push('dataUpdate');
    }

    this.registerAvailableEvents(events);
    this.dataviewImpl.availableEvents.forEach((e: string) =>
      this.dataviewImpl.on(e, (args: unknown[]) => this.emit(e, args))
    );
  }

  protected abstract buildImpl(column: string, options: DataViewOptions): void;
}

export function getCredentialsFrom(dataSource: Layer | Source): Credentials | undefined {
  let source = dataSource;

  if (source instanceof Layer) {
    source = source.source;
  }

  let credentials;

  if (
    source instanceof SQLSource ||
    source instanceof DatasetSource ||
    source instanceof DOSource
  ) {
    credentials = (source as SQLSource | DatasetSource | DOSource).credentials;
  }

  return credentials;
}

export interface DataViewOptions {
  filters?: ColumnFilters;
  spatialFilter?: SpatialFilters;
}
