import { Layer, Source } from '@/viz';
import { WithEvents } from '@/core/mixins/WithEvents';
import { Filter, ColumnFilters, SpatialFilters } from '@/viz/filters/types';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export abstract class DataViewMode extends WithEvents {
  protected dataOrigin: Layer | Source;
  public column: string;

  constructor(dataOrigin: Layer | Source, column: string) {
    super();

    validateParameters(dataOrigin, column);

    this.column = column;
    this.dataOrigin = dataOrigin;

    if (this.dataOrigin instanceof Layer) {
      this.dataOrigin.addSourceField(this.column);
    } else {
      this.dataOrigin.addField(this.column);
    }
  }

  public addFilter(filterId: string, filter: Filter) {
    this.dataOrigin.addFilter(filterId, { [this.column]: filter });
  }

  public removeFilter(filterId: string) {
    this.dataOrigin.removeFilter(filterId);
  }

  public abstract setFilters(filters: ColumnFilters): void;

  public abstract setSpatialFilter(spatialFilter: SpatialFilters): void;

  public onDataUpdate() {
    this.emit('dataUpdate');
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

export enum DataViewCalculation {
  PRECISE = 'precise',
  FAST = 'fast'
}
