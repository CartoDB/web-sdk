import { Layer, Source, GeoJSONSource } from '@/viz';

export function isGeoJSONSource(dataOrigin: Layer | Source) {
  return (
    (dataOrigin instanceof Layer && dataOrigin.getSource() instanceof GeoJSONSource) ||
    dataOrigin instanceof GeoJSONSource
  );
}

const CLUSTER_COUNT_PROPERTY = '_cdb_feature_count';

export function getFeatureValue(
  feature: Record<string, number>,
  aggregatedColumnName: string,
  column: string
): { featureValue: number; clusterCount: number; containsAggregatedData: boolean } {
  return {
    featureValue: feature[aggregatedColumnName] || feature[column],
    clusterCount: feature[CLUSTER_COUNT_PROPERTY],
    containsAggregatedData: aggregatedColumnName in feature
  };
}

export enum DataViewEvent {
  DATA_UPDATE = 'dataUpdate',
  ERROR = 'error'
}
