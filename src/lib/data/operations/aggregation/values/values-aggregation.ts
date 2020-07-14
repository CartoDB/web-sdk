import { CartoDataViewError, dataViewErrorTypes } from '@/viz/dataview/DataViewError';
import { CartoError } from '@/core/errors/CartoError';
import { areValidNumbers } from '@/core/utils/number';
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

  if (!areValidNumbers(values)) {
    throw new CartoDataViewError(
      `Column property for aggregations can just contain numbers (or nulls). Please check documentation.`,
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  const filteredValues = values.filter(Number.isFinite) as number[];

  return {
    result: aggregationFunction(filteredValues, aggregationData),
    nullCount: values.length - filteredValues.length
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
