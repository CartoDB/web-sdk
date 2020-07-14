import { SpatialFilters } from './types';
import { FilterApplicator } from './FilterApplicator';

export class RemoteFilterApplicator extends FilterApplicator<SpatialFilters> {
  public getBbox(): number[] | undefined {
    let bbox;

    if (this.filters !== 'viewport') {
      bbox = this.filters.bbox;
    }

    return bbox;
  }
}
