import { Deck } from '@deck.gl/core';
import { basicStyle, defaultStyles } from '../../style';
import { CARTOSource } from '../../sources/CARTOSource';
import { NumericFieldStats } from '../../sources/Source';
import { hexToRgb } from '../../style/helpers/utils';

const getMetadata = jest.fn().mockImplementation(() => {
  return {
    geometryType: 'Polygon',
    stats: [{} as NumericFieldStats]
  };
});

jest.mock('../../sources/CARTOSource', () => ({
  CARTOSource: jest.fn().mockImplementation(() => ({ getMetadata }))
}));

const styledLayer = {
  getMapInstance: () => ({} as Deck),
  source: new CARTOSource('table')
};

describe('BasicStyle', () => {
  describe('Style creation', () => {
    it('should create a ColorBinsStyle instance properly', () => {
      expect(() => basicStyle()).not.toThrow();
    });
  });

  describe('Parameters', () => {
    it('should assign defaultsStyles', () => {
      const style = basicStyle();
      const r = style.getLayerProps(styledLayer);
      expect(r.getFillColor).toEqual(hexToRgb(defaultStyles.Polygon.color));
    });

    it('should assign provided varaiables', () => {
      const opts = {
        color: '#123',
        strokeColor: '#456',
        opacity: 0.7,
        strokeWidth: 2
      };
      const style = basicStyle(opts);
      const r = style.getLayerProps(styledLayer);
      expect(r.getFillColor).toEqual(hexToRgb(opts.color));
      expect(r.getLineColor).toEqual(hexToRgb(opts.strokeColor));
      expect(r.getLineWidth).toEqual(opts.strokeWidth);
      expect((r as any).opacity).toEqual(opts.opacity);
    });
  });
});
