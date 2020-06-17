import { shouldInitialize } from '../sources/Source';

describe('Source', () => {
  describe('shouldInitialize', () => {
    it('should initialize always for first time (isInitialized === false)', () => {
      const isInitialized = false;
      const sample: Set<string> = new Set();
      const aggregation: Set<string> = new Set();
      const newFields = { sample, aggregation };
      const currentFields: Set<string> = new Set();

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(true);
    });

    it('should initialize with new fields', () => {
      const isInitialized = true;
      const sample: Set<string> = new Set(['field']);
      const aggregation: Set<string> = new Set();
      const newFields = { sample, aggregation };
      const currentFields: Set<string> = new Set();

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(true);
    });

    it('should not initialize with same fields', () => {
      const isInitialized = true;
      const sample: Set<string> = new Set(['field']);
      const aggregation: Set<string> = new Set();
      const newFields = { sample, aggregation };
      const currentFields: Set<string> = new Set(['field']);

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(false);
    });

    it('should not initialize with less fields', () => {
      const isInitialized = true;
      const sample: Set<string> = new Set(['field']);
      const aggregation: Set<string> = new Set();
      const newFields = { sample, aggregation };
      const currentFields: Set<string> = new Set(['field']);

      const result = shouldInitialize(isInitialized, newFields, currentFields);
      expect(result).toEqual(false);
    });
  });
});
