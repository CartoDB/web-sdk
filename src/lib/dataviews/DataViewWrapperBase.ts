import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { Filter } from '@/viz/filters/types';
import { AggregationType } from '@/maps/MapsDataviews';
import { DataViewImplBase } from './DataViewImplBase';
import { DataViewModeBase, DataViewModeAlias } from './mode/DataViewModeBase';

const OPTION_CHANGED_DELAY = 100;

export abstract class DataViewWrapperBase extends WithEvents {
  protected dataviewImpl!: DataViewImplBase<DataViewModeBase<Layer | Source>>;

  /**
   * optionChanged timeout to prevent multiple
   * calls when user sets several options in a row
   */
  private optionChangedTimeoutId?: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(dataSource: Layer | Source, column: string, options: any) {
    super();

    const mode = options.mode || DataViewModeAlias.VIEWPORT;
    this.buildImpl(dataSource, column, options, mode);

    // bind events with the mode
    this.bindEvents();

    this.on('optionChanged', () => {
      // timeout prevents multiple calls to getData
      // when user sets several options in a row
      if (this.optionChangedTimeoutId) {
        window.clearTimeout(this.optionChangedTimeoutId);
      }

      this.optionChangedTimeoutId = window.setTimeout(
        () => this.emit('dataUpdate'),
        OPTION_CHANGED_DELAY
      );
    });
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
    this.dataviewImpl.column = column;
    this.emit('optionChanged');
  }

  public get operation() {
    return this.dataviewImpl.operation;
  }

  public set operation(operation: AggregationType) {
    this.dataviewImpl.operation = operation;
    this.emit('optionChanged');
  }

  private bindEvents() {
    const events = [...this.dataviewImpl.availableEvents];

    if (!events.includes('optionChanged')) {
      events.push('optionChanged');
    }

    if (!events.includes('dataUpdate')) {
      events.push('dataUpdate');
    }

    this.registerAvailableEvents(events);
    this.dataviewImpl.availableEvents.forEach((e: string) =>
      this.dataviewImpl.on(e, (args: any[]) => this.emit(e, args))
    );
  }

  protected abstract buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: { mode?: DataViewModeAlias },
    mode: DataViewModeAlias
  ): void;
}
