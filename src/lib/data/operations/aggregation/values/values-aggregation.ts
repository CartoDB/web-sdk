import { CartoError } from '@/core/errors/CartoError';
import { AggregationType } from '../AggregationType';

export function aggregateValues(
  values: number[],
  aggregation: AggregationType = '' as AggregationType
) {
  const aggregationData = aggregation.split('_');
  const aggregationName = aggregationData.shift();

  const aggregationFunction =
    aggregationFunctions[aggregationName?.toLowerCase() as AggregationType];

  if (!aggregationFunction) {
    throw new CartoError({
      type: '[DataView]',
      message: `"${aggregation}" aggregation type not implemented`
    });
  }

  const shouldFilterValues = aggregationName !== AggregationType.COUNT;

  const valuesToAggregate = shouldFilterValues
    ? (values.filter(Number.isFinite) as number[])
    : values;

  return {
    result: aggregationFunction(valuesToAggregate, aggregationData),
    nullCount: values.length - valuesToAggregate.length
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
const aggregationFunctions: Record<AggregationType, Function> = {
  [AggregationType.COUNT](values: number[]) {
    return values.length;
  },

  [AggregationType.AVG](values: number[]) {
    return aggregationFunctions.sum(values) / values.length;
  },

  [AggregationType.MIN](values: number[]) {
    return Math.min(...values);
  },

  [AggregationType.MAX](values: number[]) {
    return Math.max(...values);
  },

  [AggregationType.SUM](values: number[]) {
    return values.reduce((sum, value) => sum + value, 0);
  },

  [AggregationType.PERCENTILE](values: number[], aggregationData: string[]) {
    const percentile = parseInt(aggregationData[0], 10);

    if (!Number.isInteger(percentile) || percentile < 0 || percentile > 100) {
      throw new CartoError({
        type: '[DataView]',
        message: `"${percentile}" percentile value is not correct`
      });
    }

    const orderedValues = values.sort((x, y) => x - y);
    const p = percentile / 100;
    return orderedValues[Math.floor(p * orderedValues.length)];
  }
};
