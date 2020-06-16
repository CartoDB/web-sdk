import { WithEvents } from '@/core/mixins/WithEvents';
import { Filterable } from '@/viz/filters/Filterable';
import { Filter } from '@/viz/filters/types';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';
import { AggregationType } from '../operations/aggregation/aggregation';

export abstract class DataViewMode<T extends Filterable> extends WithEvents {
  protected dataSource: T;
  public column: string;

  constructor(dataSource: T, column: string) {
    super();

    validateParameters(dataSource, column);

    this.column = column;
    this.dataSource = dataSource;
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataSource.addFilter(filterId, { [this.column]: filter });
  }

  public removeFilter(filterId: string) {
    this.dataSource.removeFilter(filterId);
  }

  // eslint-disable-next-line class-methods-use-this
  async getData(): Promise<Partial<DataViewData>> {
    throw new CartoDataViewError('Method getData is not implemented');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateParameters(source: any, column: string) {
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

export enum DataViewModeAlias {
  GLOBAL = 'global',
  VIEWPORT = 'viewport',
  NON_PRECISE = 'non-precise'
}
