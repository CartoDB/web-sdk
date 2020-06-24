import deepmerge from 'deepmerge';
import { FilterApplicator } from './FilterApplicator';

export class FiltersCollection<T, K extends FilterApplicator<T>> {
  private collection: Map<string, T> = new Map();
  private FilterApplicatorClass: { new (filters: T): K };

  constructor(FilterApplicatorClass: { new (filters: T): K }) {
    this.FilterApplicatorClass = FilterApplicatorClass;
  }

  addFilter(filterId: string, filterDefinition: T) {
    this.collection.set(filterId, filterDefinition);
  }

  removeFilter(filterId: string) {
    this.collection.delete(filterId);
  }

  getApplicatorInstance() {
    const filters = this._mergeFilters();
    return new this.FilterApplicatorClass(filters);
  }

  getUpdateTriggers() {
    return {
      getFilterValue: [this._getUniqueID()]
    };
  }

  protected _getUniqueID() {
    return JSON.stringify(Array.from(this.collection.values()));
  }

  protected _mergeFilters(): T {
    return deepmerge.all(Array.from(this.collection.values())) as T;
  }
}
