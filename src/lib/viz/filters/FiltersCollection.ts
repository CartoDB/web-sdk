import deepmerge from 'deepmerge';
import { FilterApplicator } from './FilterApplicator';

export class FiltersCollection<T, K extends FilterApplicator<T>> {
  private collection: Map<string, T> = new Map();
  private FilterApplicatorClass: { new (filters: T): K };

  constructor(FilterApplicatorClass: { new (filters: T): K }) {
    this.FilterApplicatorClass = FilterApplicatorClass;
  }

  hasFilters() {
    return Boolean(this.collection.size);
  }

  addFilter(filterId: string, filterDefinition: T) {
    this.collection.set(filterId, filterDefinition);
  }

  removeFilter(filterId: string) {
    this.collection.delete(filterId);
  }

  getApplicatorInstance(excludedFilters: string[] = []) {
    const filters = this._mergeFilters(excludedFilters);
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

  protected _mergeFilters(excludedFilters: string[]): T {
    const mergeOptions: deepmerge.Options = {
      arrayMerge
    };

    const filters = new Map(this.collection);
    excludedFilters.forEach(filter => filters.delete(filter));

    return deepmerge.all(Array.from(this.collection.values()), mergeOptions) as T;
  }
}

function arrayMerge(target: number[] | string[] = [], source: number[] | string[]) {
  const isNumericFilter = Number.isFinite(source[0]);

  if (isNumericFilter) {
    return [...target, source];
  }

  return [...target, ...source];
}
