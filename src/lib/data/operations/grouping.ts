export function groupValuesByAnotherColumn<T>(
  data: Record<string, T>[],
  valuesColumn: string,
  keysColumn: string
) {
  let nullCount = 0;

  const groups = data.reduce(
    (accumulator: Record<string, T[]>, item: Record<string, string | T>) => {
      const group = item[keysColumn] as string;

      accumulator[group] = accumulator[group] || [];

      const isValid = item[valuesColumn] !== null && item[valuesColumn] !== undefined;

      if (isValid) {
        accumulator[group].push(item[valuesColumn] as T);
      } else {
        nullCount += 1;
      }

      return accumulator;
    },
    {}
  );

  return {
    groups,
    nullCount
  };
}

export function groupValues(data: Record<string, unknown>[], keysColumn: string) {
  let nullCount = 0;

  const groups = data.reduce(
    (accumulator: Record<string, number>, item: Record<string, unknown>) => {
      const isValid = item[keysColumn] !== null && item[keysColumn] !== undefined;

      if (isValid) {
        const group = item[keysColumn] as string;
        accumulator[group] = accumulator[group] || 0;
        accumulator[group] += 1;
      } else {
        nullCount += 1;
      }

      return accumulator;
    },
    {}
  );

  return {
    groups,
    nullCount
  };
}
