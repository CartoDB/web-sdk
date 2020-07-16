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
    return (
      aggregationFunctions.sum(aggregatedFeatures) / aggregationFunctions.count(aggregatedFeatures)
    );
  },

  [AggregationType.MIN](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return Math.min(...aggregatedFeatures.map(feature => feature.aggregatedValue));
  },

  [AggregationType.MAX](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return Math.max(...aggregatedFeatures.map(feature => feature.aggregatedValue));
  },

  [AggregationType.SUM](aggregatedFeatures: AggregatedFeatureProperties[]) {
    return aggregatedFeatures.reduce(
      (total, feature) => total + feature.aggregatedValue * feature.featureCount,
      0
    );
  },

  [AggregationType.PERCENTILE]() {
    return 0;
  }
};
