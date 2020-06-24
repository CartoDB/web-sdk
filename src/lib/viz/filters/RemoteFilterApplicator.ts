import { SpatialFilters } from './types';
import { FilterApplicator } from './FilterApplicator';

export class RemoteFilterApplicator extends FilterApplicator<SpatialFilters> {
  public getBbox(): number[] | undefined {
    return this.filters.within;
  }
}
