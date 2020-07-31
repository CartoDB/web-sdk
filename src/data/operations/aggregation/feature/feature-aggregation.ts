import { CartoError } from '../../../../core/errors/CartoError';
import { AggregationType } from '../AggregationType';

export interface AggregatedFeatureProperties {
  aggregatedValue: number;
  featureCount: number;
}

export function aggregateFeatures(
  features: AggregatedFeatureProperties[],
  aggregation: AggregationType = '' as AggregationType
) {
  const aggregationData = aggregation.split('_');
  const aggregationName = aggregationData.shift();

  const aggregationFunction =
    aggregationFunctions[aggregationName?.toLowerCase() as AggregationType];

  if (!aggregationFunction) {
    throw new CartoError({
      type: '[DataView]',
      message: `"${aggregation}" feature aggregation type not implemented`
    });
  }

  return {
    result: aggregationFunction(features, aggregationData),
    nullCount: 0
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
const aggregationFunctions: Record<AggregationType, Function> = {
  [AggregationType.COUNT](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return aggregatedFeatures.reduce((total, feature) => total + feature.featureCount, 0);
  },

  [AggregationType.AVG](aggregatedFeatures: AggregatedFeatureProperties[]) {
    let totalFeatureCount = 0;

    const totalSum = aggregatedFeatures.reduce((total, feature) => {
      totalFeatureCount += feature.featureCount;
      return total + Number(feature.aggregatedValue) * feature.featureCount;
    }, 0);
    return totalSum / totalFeatureCount;
  },

  [AggregationType.MIN](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return Math.min(...aggregatedFeatures.map(feature => Number(feature.aggregatedValue)));
  },

  [AggregationType.MAX](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return Math.max(...aggregatedFeatures.map(feature => Number(feature.aggregatedValue)));
  },

  [AggregationType.SUM](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return aggregatedFeatures.reduce(
      (total, feature) => total + Number(feature.aggregatedValue),
      0
    );
  },

  [AggregationType.PERCENTILE]() {
    return 0;
  }
};
