type Dictionary<K extends string, T> = Partial<Record<K, T>>;

export type SpatialFilterTypes = 'bbox';
export type FilterTypes = 'in' | 'within';
export type Filter = Dictionary<FilterTypes, string[]>;
export type ColumnFilters = Dictionary<string, Filter>;
export type SpatialFilters = Dictionary<SpatialFilterTypes, number[]> | 'viewport';
