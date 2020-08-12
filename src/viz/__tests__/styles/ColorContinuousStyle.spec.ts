import { Deck } from '@deck.gl/core';
import { scale as chromaScale } from 'chroma-js';
import { DatasetSource } from '@/viz';
import { colorContinuousStyle } from '../../style';
import * as mapsResponse from '../data-mocks/maps.number.json';
import { hexToRgb } from '../../style/helpers/utils';
import { CartoStylingError } from '../../errors/styling-error';

const FIELD_NAME = 'pct_higher_ed';
const mapStats = mapsResponse.metadata.layers[0].meta.stats;
const sample = mapStats.sample.map(s => s.pct_higher_ed);
const stats = {
  name: FIELD_NAME,
  ...mapStats.columns.pct_higher_ed,
  sample
};
const getMetadata = jest.fn().mockImplementation(() => {
  return {
    geometryType: 'Polygon',
    stats: [stats]
  };
});
const isEmpty = jest.fn().mockImplementation(() => false);

jest.mock('../../source/DatasetSource', () => ({
  DatasetSource: jest.fn().mockImplementation(() => ({ getMetadata, isEmpty }))
}));

const styledLayer = {
  getMapInstance: () => ({} as Deck),
  source: new DatasetSource('table')
};

describe('ColorContinuousStyle', () => {
  describe('Style creation', () => {
    it('should create a ColorContinuousStyle instance properly', () => {
      expect(() => colorContinuousStyle('attributeName')).not.toThrow();
    });

    it('should always return a getFillColor function', async () => {
      const style = colorContinuousStyle(FIELD_NAME);
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getFillColor');
      expect(response.getFillColor).toBeInstanceOf(Function);
    });
  });

  describe('Paramters', () => {
    it('should fail with invalid palette', () => {
      const style = colorContinuousStyle(FIELD_NAME, {
        palette: 'unexisting'
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with invalid ranges', () => {
      const style = colorContinuousStyle(FIELD_NAME, {
        rangeMin: 1,
        rangeMax: 1
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with invalid nullColor', () => {
      const style = colorContinuousStyle(FIELD_NAME, {
        nullColor: '#'
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('If geometryType is Polygon and property is strokeColor getLineColor should be a function', async () => {
      const style = colorContinuousStyle(FIELD_NAME, {
        property: 'strokeColor'
      });
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getLineColor');
      expect(response.getLineColor).toBeInstanceOf(Function);
    });

    it('If geometryType is Point and property is strokeColor getLineColor should be a function', async () => {
      const style = colorContinuousStyle(FIELD_NAME, {
        property: 'strokeColor'
      });
      const styleLayerPoint = { ...styledLayer };
      styleLayerPoint.source.getMetadata = jest.fn().mockImplementation(() => {
        return {
          geometryType: 'Point',
          stats: [stats]
        };
      });
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getLineColor');
      expect(response.getLineColor).toBeInstanceOf(Function);
    });
  });

  describe('Data validation', async () => {
    const opts = {
      palette: ['#f00', '#00f', '#aff'],
      nullColor: '#0f0'
    };
    const style = colorContinuousStyle(FIELD_NAME, opts);
    let getFillColor = (await style.getLayerProps(styledLayer)).getFillColor as (d: any) => any;

    it('should assign the right color to a feature', () => {
      const featureValue = 30;
      const r = getFillColor({ properties: { [FIELD_NAME]: featureValue } });

      const expectedColor = chromaScale(opts.palette)
        .domain([stats.min, stats.max])
        .mode('lrgb')(featureValue)
        .rgb();

      expect(r).toEqual(expectedColor);
    });

    it('should assign the right color to a null feature', () => {
      const r = getFillColor({ properties: { [FIELD_NAME]: null } });
      expect(r).toEqual(hexToRgb(opts.nullColor));
    });

    it('should assign the right color to a feature using ranges', async () => {
      const rangeMin = 0;
      const rangeMax = 100;
      const featureValue = 30;
      const s = colorContinuousStyle(FIELD_NAME, {
        ...opts,
        rangeMin,
        rangeMax
      });
      getFillColor = (await s.getLayerProps(styledLayer)).getFillColor as (d: any) => any;

      const expectedColor = chromaScale(opts.palette)
        .domain([rangeMin, rangeMax])
        .mode('lrgb')(featureValue)
        .rgb();

      const r = getFillColor({ properties: { [FIELD_NAME]: featureValue } });
      expect(r).toEqual(expectedColor);
    });
  });
});
