type Dictionary<K extends string, T> = Partial<Record<K, T>>;

export type SpatialFilterTypes = 'within' | 'intersect';
export type FilterTypes = 'in';
export type Filter = Dictionary<FilterTypes, string[]>;
export type ColumnFilters = Dictionary<string, Filter>;
export type SpatialFilters = Dictionary<SpatialFilterTypes, number[]>;
export enum BuiltInFilters {
  VIEWPORT = 'viewport'
}
