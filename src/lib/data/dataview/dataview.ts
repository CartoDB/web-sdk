import { CartoError } from '@/core/errors/CartoError';
import { WithEvents } from '@/core/mixins/WithEvents';
import { AggregationType } from '../operations/aggregation/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';
import { Filter } from './types';

export abstract class DataView<T> extends WithEvents {
  protected dataSource: T;
  protected _column: string;

  constructor(dataSource: T, column: string) {
    super();

    this.dataSource = dataSource;
    this._column = column;
  }

  // eslint-disable-next-line class-methods-use-this
  async getData(): Promise<Partial<DataViewData>> {
    throw new CartoError({
      type: `[DataView]`,
      message: 'Method getData is not implemented'
    });
  }

  addFilter(filterId: string, filter: Filter) {
    this.dataSource.addFilter(filterId, { [this.column]: filter });
  }

  removeFilter(filterId: string) {
    this.dataSource.removeFilter(filterId);
  }

  public get column() {
    return this._column;
  }

  public set column(newColumn: string) {
    this.validateParameters(this.dataSource, newColumn);
    this._column = newColumn;
  }

  // eslint-disable-next-line class-methods-use-this
  protected validateParameters(source: T, column: string) {
    if (!source) {
      throw new CartoDataViewError(
        'Source was not provided while creating dataview',
        dataViewErrorTypes.PROPERTY_MISSING
      );
    }

    if (!column) {
      throw new CartoDataViewError(
        'Column name was not provided while creating dataview',
        dataViewErrorTypes.PROPERTY_MISSING
      );
    }
  }
}

export interface DataViewData {
  result: number;
  categories: {
    name: string;
    value: number;
  }[];
  count: number;
  operation: AggregationType;
  max: number;
  min: number;
  nullCount: number;
}
