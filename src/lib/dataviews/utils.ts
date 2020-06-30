import { Layer, Source } from '@/viz';
import { GeoJsonSource } from '@/viz/sources';

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

export function isGeoJSONSource(dataSource: Layer | Source) {
  return (
    (dataSource instanceof Layer && dataSource.source instanceof GeoJsonSource) ||
    dataSource instanceof GeoJsonSource
  );
}
