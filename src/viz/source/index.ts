export { SQLSource } from './SQLSource';
export { DatasetSource } from './DatasetSource';
export { DOSource } from './DOSource';
export { GeoJSONSource } from './GeoJSONSource';
export { Source } from './Source';

// Interfaces should be exported as type to help the build (babel) for
// ESM and CommonJS. More info: https://github.com/babel/babel/issues/8361
export type {
  AggregatedColumn,
  Stats,
  GeometryType,
  CategoryFieldStats,
  Category,
  NumericFieldStats,
  SourceMetadata
} from './Source';
