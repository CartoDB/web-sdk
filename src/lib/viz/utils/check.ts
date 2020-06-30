import { Layer, Source } from '@/viz';
import { GeoJsonSource } from '../sources';

export function isGeoJSONSource(dataSource: Layer | Source) {
  return (
    (dataSource instanceof Layer && dataSource.source instanceof GeoJsonSource) ||
    dataSource instanceof GeoJsonSource
  );
}
