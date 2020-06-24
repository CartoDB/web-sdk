export abstract class FilterApplicator<T> {
  protected filters: T;

  constructor(filters: T) {
    this.filters = { ...filters };
  }
}
