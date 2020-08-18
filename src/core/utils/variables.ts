/**
 * Check if value is different from undefined & null
 *
 * @export
 * @param {unknown} value
 * @returns {boolean}
 */
export function isVariableDefined(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/**
 * Check if value has no 'content'.
 * It returns:
 *  - true for: undefined, null, '', [], {}
 *  - false for: true, false, 1, 0, -1, "foo", [1, 2, 3], { foo: 1 }
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isEmpty(value: any): boolean {
  const isNotDefined = !isVariableDefined(value);
  const isArrayAndEmpty =
    Object.prototype.hasOwnProperty.call(value, 'length') && value.length === 0;

  const isObjectAndNoKeys = value.constructor === Object && Object.keys(value).length === 0;

  return isNotDefined || isArrayAndEmpty || isObjectAndNoKeys;
}
