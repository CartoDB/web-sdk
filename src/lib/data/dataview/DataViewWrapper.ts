import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { Filter } from '@/viz/filters/types';
import { AggregationType } from '@/maps/MapsDataviews';
import { DataViewBase } from './DataViewBase';
import { DataViewMode, DataViewModeAlias } from './DataViewMode';

const OPTION_CHANGED_DELAY = 100;

export abstract class DataViewWrapper extends WithEvents {
  protected dataviewWrappee!: DataViewBase<DataViewMode<Layer | Source>>;

  /**
   * optionChanged timeout to prevent multiple
   * calls when user sets several options in a row
   */
  private optionChangedTimeoutId?: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(dataSource: Layer | Source, column: string, options: any) {
    super();

    const mode = options.mode || DataViewModeAlias.VIEWPORT;
    this.buildWrappee(dataSource, column, options, mode);

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
    return this.dataviewWrappee.getData();
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataviewWrappee.addFilter(filterId, filter);
  }

  public removeFilter(filterId: string) {
    this.dataviewWrappee.removeFilter(filterId);
  }

  public get column() {
    return this.dataviewWrappee.column;
  }

  public set column(column: string) {
    this.dataviewWrappee.column = column;
    this.emit('optionChanged');
  }

  public get operation() {
    return this.dataviewWrappee.operation;
  }

  public set operation(operation: AggregationType) {
    this.dataviewWrappee.operation = operation;
    this.emit('optionChanged');
  }

  private bindEvents() {
    const events = [...this.dataviewWrappee.availableEvents];

    if (!events.includes('optionChanged')) {
      events.push('optionChanged');
    }

    if (!events.includes('dataUpdate')) {
      events.push('dataUpdate');
    }

    this.registerAvailableEvents(events);
    this.dataviewWrappee.availableEvents.forEach((e: string) =>
      this.dataviewWrappee.on(e, (args: any[]) => this.emit(e, args))
    );
  }

  protected abstract buildWrappee(
    dataSource: Layer | Source,
    column: string,
    options: { mode?: DataViewModeAlias },
    mode: DataViewModeAlias
  ): void;
}
