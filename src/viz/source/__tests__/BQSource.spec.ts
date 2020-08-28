import { BQSource } from '@/viz/source/BQSource';

const DEFAULT_DATASET = 'cartobq.maps.ais_tileset';

describe('BQSource', () => {
  describe('Source creation', () => {
    it('should create a new source instance properly', () => {
      expect(() => new BQSource(DEFAULT_DATASET)).not.toThrow();
    });

    it('should fetch tileset urls on init', () => {
      const bq = new BQSource(DEFAULT_DATASET);

      expect(() => bq.init()).not.toThrow();
    });
  });
});
