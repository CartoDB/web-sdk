import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { Filter } from '@/viz/filters/types';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { DataViewImpl } from './DataViewImpl';
import { DataViewMode, DataViewCalculation } from './mode/DataViewMode';
import { debounce } from './utils';

export const OPTION_CHANGED_DELAY = 100;

export abstract class DataViewWrapper extends WithEvents {
  protected dataviewImpl!: DataViewImpl<DataViewMode>;

  /**
   * Debounce scope to prevent multiple calls
   * when options changed in a row
   */
  protected setOptionScope: { timeoutId?: number } = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(dataSource: Layer | Source, column: string, options: any) {
    super();

    this.buildImpl(dataSource, column, {
      mode: DataViewCalculation.REMOTE,
      ...options
    });

    // bind events with the mode
    this.bindEvents();
  }

  public getData() {
    return this.dataviewImpl.getData();
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
    debounce(
      () => {
        this.dataviewImpl.column = column;
        this.emit('dataUpdate');
      },
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )(column);
  }

  public get operation() {
    return this.dataviewImpl.operation;
  }

  public set operation(operation: AggregationType) {
    debounce(
      () => {
        this.dataviewImpl.operation = operation;
        this.emit('dataUpdate');
      },
      OPTION_CHANGED_DELAY,
      this.setOptionScope
    )(operation);
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
