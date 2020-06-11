type Dictionary<K extends string, T> = Partial<Record<K, T>>;

export type FilterTypes = 'in';
export type Filter = Dictionary<FilterTypes, string[]>;
export type ColumnFilters = Dictionary<string, Filter>;
