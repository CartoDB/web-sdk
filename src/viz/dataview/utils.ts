import { Layer, Source, GeoJSONSource } from '@/viz';

/**
 * This prevents multiple calls to a function by establishing
 * a timeout.
 * @param func function to debounce.
 * @param timeToWait time in milliseconds to wait for the function
 * execution.
 * @param sharedScope scope shared by two or more functions in order
 * to prevent multiple calls between them.
 */
export function debounce(
  func: (...args: unknown[]) => unknown,
  timeToWait = 100,
  sharedScope: { timeoutId?: number } = {}
) {
  return function debouncedFunction(this: unknown, ...args: unknown[]) {
    const scope = sharedScope;
    const { timeoutId } = scope;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    scope.timeoutId = window.setTimeout(() => func.apply(this, args), timeToWait);
  };
}

export function isGeoJSONSource(dataOrigin: Layer | Source) {
  return (
    (dataOrigin instanceof Layer && dataOrigin.source instanceof GeoJSONSource) ||
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
