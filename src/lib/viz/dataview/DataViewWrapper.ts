import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { Credentials } from '@/auth';
import { Filter } from '@/viz/filters/types';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { DataViewImpl } from './DataViewImpl';
import { DataViewMode, DataViewCalculation } from './mode/DataViewMode';
import { debounce } from './utils';
import { SQLSource, DatasetSource, DOSource } from '../source';

export const OPTION_CHANGED_DELAY = 100;

export abstract class DataViewWrapper extends WithEvents {
  protected dataviewImpl!: DataViewImpl<DataViewMode>;

  /**
   * Debounce scope to prevent multiple calls
   * when options changed in a row
   */
  protected setOptionScope: { timeoutId?: number } = {};

  constructor(dataSource: Layer | Source, column: string, options: Record<string, unknown> = {}) {
    super();

    this.buildImpl(dataSource, column, {
      mode: DataViewCalculation.REMOTE,
      ...options
    });

    // bind events with the mode
    this.bindEvents();
  }

  public getData(filterId?: string) {
    return this.dataviewImpl.getData(filterId);
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataviewImpl.addFilter(filterId, filter);
  }

  public removeFilter(filterId: string) {
    this.dataviewImpl.removeFilter(filterId);
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

  protected abstract buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: { mode?: DataViewCalculation }
  ): void;
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
