import { isVariableDefined } from './variables';

export function castToNumberOrUndefined(number: string | number) {
  const castedNumber = Number(number);

  if (!Number.isFinite(castedNumber)) {
    return;
  }

  // eslint-disable-next-line consistent-return
  return castedNumber;
}

/**
 * Check if the values are numbers or null | undefined, taking a small sample
 * @param features
 */
export function areValidNumbers(values: (number | undefined)[]) {
  const sample = values.slice(0, Math.min(values.length, 10));

  return sample.every(value => isVariableDefined(value) && typeof value === 'number');
}
