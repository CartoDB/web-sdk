import { Deck } from '@deck.gl/core';
import { DatasetSource } from '@/viz';
import { uuidv4 } from '@/core/utils/uuid';
import { colorCategoriesStyle } from '../../style';
import * as mapsResponse from '../data-mocks/maps.category.json';
import { CartoStylingError } from '../../errors/styling-error';
import { hexToRgb, getColors } from '../../style/helpers/utils';
import { DEFAULT_PALETTE } from '../../style/helpers/color-categories-style';

const FIELD_NAME = 'category';
const mapStats = mapsResponse.metadata.layers[0].meta.stats;

const getMetadata = jest.fn().mockImplementation(() => {
  return {
    geometryType: 'Point',
    stats: [
      {
        name: FIELD_NAME,
        categories: mapStats.columns[FIELD_NAME].categories
      }
    ]
  };
});

const isEmpty = jest.fn().mockImplementation(() => false);

jest.mock('../../source/DatasetSource', () => ({
  DatasetSource: jest.fn().mockImplementation(() => ({ getMetadata, isEmpty }))
}));

const styledLayer = {
  getId: () => uuidv4(),
  getMap: () => ({} as Deck),
  getSource: () => new DatasetSource('table')
};

describe('ColorCategoriesStyle', () => {
  describe('Style creation', () => {
    it('should create a colorCategoriesStyle properly', () => {
      expect(() => colorCategoriesStyle('attributeName')).not.toThrow();
    });

    it('should always return a getFillColor function', async () => {
      const style = colorCategoriesStyle(FIELD_NAME);
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getFillColor');
      expect(response.getFillColor).toBeInstanceOf(Function);
    });
  });

  describe('Parameters', () => {
    it('should launch styling error when categories and palette size missmatch', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        categories: ['uno'],
        palette: ['#ff0', '#231']
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should not launch styling error if palette is a cartocolor and it can fit the categories size', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        categories: ['one', 'two', 'three'],
        palette: 'prism'
      });
      expect(() => style.getLayerProps(styledLayer)).not.toThrow(CartoStylingError);
    });

    it('should fail with top less than 1', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        top: 0
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with top greather than 12', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        top: 13
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with invalid palette', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        palette: 'unexisting'
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with invalid nullColor', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        nullColor: '#'
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('should fail with invalid color', () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        othersColor: '#'
      });

      try {
        style.getLayerProps(styledLayer);
      } catch (error) {
        expect(error).toBeInstanceOf(CartoStylingError);
      }
    });

    it('If geometryType is Polygon and property is strokeColor getLineColor should be a function', async () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        property: 'strokeColor'
      });
      const styleLayerPoint = { ...styledLayer };
      styleLayerPoint.getSource().getMetadata = jest.fn().mockImplementation(() => {
        return {
          geometryType: 'Polygon',
          stats: [
            {
              name: FIELD_NAME,
              categories: mapStats.columns[FIELD_NAME].categories
            }
          ]
        };
      });
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getLineColor');
      expect(response.getLineColor).toBeInstanceOf(Function);
    });

    it('If geometryType is Point and property is strokeColor getLineColor should be a function', async () => {
      const style = colorCategoriesStyle(FIELD_NAME, {
        property: 'strokeColor'
      });
      const response = await style.getLayerProps(styledLayer);
      expect(response).toHaveProperty('getLineColor');
      expect(response.getLineColor).toBeInstanceOf(Function);
    });
  });

  describe('Data validation', async () => {
    const opts = {
      categories: ['Moda y calzado', 'Bares y restaurantes', 'Salud'],
      palette: ['#000', '#111', '#222'],
      nullColor: '#f00',
      othersColor: '#00f'
    };

    const style = colorCategoriesStyle(FIELD_NAME, opts);

    let getFillColor = (await style.getLayerProps(styledLayer)).getFillColor as (d: any) => any;

    it('should assign the right color to a category', () => {
      const r = getFillColor({
        properties: { [FIELD_NAME]: opts.categories[0] }
      });
      expect(r).toEqual(hexToRgb(opts.palette[0]));
    });

    it('should assign the right color to others', () => {
      const r = getFillColor({
        properties: { [FIELD_NAME]: 'Cuidado personal' }
      });
      expect(r).toEqual(hexToRgb(opts.othersColor));
    });

    it('should assign the right color to a null feature', () => {
      const r = getFillColor({ properties: { [FIELD_NAME]: null } });
      expect(r).toEqual(hexToRgb(opts.nullColor));
    });

    it('should assign the right color when top defined', async () => {
      const top = 1;
      const s = colorCategoriesStyle(FIELD_NAME, { ...opts, top });

      getFillColor = (await s.getLayerProps(styledLayer)).getFillColor as (d: any) => any;

      const r = getFillColor({
        properties: { [FIELD_NAME]: 'Bares y restaurantes' }
      });
      expect(r).toEqual(hexToRgb(opts.othersColor));
    });

    it('should assign the right color to feature using dynamic categories', async () => {
      const colors = getColors(DEFAULT_PALETTE, 5);
      const response = await colorCategoriesStyle(FIELD_NAME).getLayerProps(styledLayer);
      getFillColor = response.getFillColor as (d: any) => any;
      const r = getFillColor({
        properties: { [FIELD_NAME]: 'Moda y calzado' }
      });
      expect(r).toEqual(hexToRgb(colors[0]));
    });
  });
});
