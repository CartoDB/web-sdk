import { shouldInitialize } from '../sources/Source';

describe('Source', () => {
  describe('shouldInitialize', () => {
    const emptySet: Set<string> = new Set();
    const filledSet: Set<string> = new Set(['field']);

    it('should initialize always for first time (isInitialized === false)', () => {
      const isInitialized = false;
      const newFields = { sample: emptySet, aggregation: emptySet };
      const currentFields = { sample: emptySet, aggregation: emptySet };

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(true);
    });

    it('should not initialize again if all are equal', () => {
      const isInitialized = true;
      const newFields = { sample: emptySet, aggregation: emptySet };
      const currentFields = { sample: emptySet, aggregation: emptySet };

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(false);
    });

    it('should initialize with new fields', () => {
      const isInitialized = true;
      const newFields = { sample: filledSet, aggregation: emptySet };
      const currentFields = { sample: emptySet, aggregation: emptySet };

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(true);
    });

    it('should not initialize again with same fields', () => {
      const isInitialized = true;
      const newFields = { sample: filledSet, aggregation: emptySet };
      const currentFields = { sample: filledSet, aggregation: emptySet };

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(false);
    });

    it('should not initialize with less fields', () => {
      const isInitialized = true;
      const newFields = { sample: filledSet, aggregation: emptySet };
      const currentFields = { sample: filledSet, aggregation: filledSet };

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(false);
    });
  });
});
