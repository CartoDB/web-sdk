import { CartoError } from '../../../../core/errors/CartoError';
import { aggregateFeatures } from './feature-aggregation';
import { AggregationType } from '../AggregationType';

describe('Feature Aggregation', () => {
  describe('Errors', () => {
    it('should throw an exception when aggregation type is not implemented', () => {
      expect(() => aggregateFeatures(values, 'unknownAggregation' as AggregationType)).toThrow(
        new CartoError({
          type: '[DataView]',
          message: '"unknownAggregation" feature aggregation type not implemented'
        })
      );
    });
  });

  describe('aggregate', () => {
    it(AggregationType.COUNT, async () => {
      expect(aggregateFeatures(values, AggregationType.COUNT).result).toEqual(18);
    });

    it(AggregationType.AVG, async () => {
      expect(aggregateFeatures(values, AggregationType.AVG).result).toEqual(34.44444444444444);
    });

    it(AggregationType.MIN, async () => {
      expect(aggregateFeatures(values, AggregationType.MIN).result).toEqual(10);
    });

    it(AggregationType.MAX, async () => {
      expect(aggregateFeatures(values, AggregationType.MAX).result).toEqual(50);
    });

    it(AggregationType.SUM, async () => {
      expect(aggregateFeatures(values, AggregationType.SUM).result).toEqual(150);
    });

    it.skip('percentile_50', async () => {
      expect(aggregateFeatures(values, 'percentile_50' as AggregationType).result).toEqual(0);
    });
  });
});

const values = [
  { aggregatedValue: 10, featureCount: 2 },
  { aggregatedValue: 20, featureCount: 1 },
  { aggregatedValue: 30, featureCount: 5 },
  { aggregatedValue: 40, featureCount: 7 },
  { aggregatedValue: 50, featureCount: 3 }
];
