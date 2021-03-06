/*
    A generic data source event might be emitted by a 'Source' or a 'Layer'.
    For some operations (eg. DataView related ones) they can have a similar behaviour
*/
export enum GenericDataSourceEvent {
  FILTER_CHANGE = 'filterChange'
}

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
