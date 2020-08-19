/* eslint-disable no-new */
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { CartoError } from '@/core/errors/CartoError';
import { queryDOMElement } from '@/core/utils/dom';
import { Deck, RGBAColor } from '@deck.gl/core';
import { LegendWidget, LegendProperties } from '../legend';
import { Layer } from '../layer';
import { GeoJSONSource, NumericFieldStats } from '../source';
import {
  defaultStyles,
  sizeBinsStyle,
  colorCategoriesStyle,
  colorContinuousStyle,
  colorBinsStyle,
  sizeCategoriesStyle,
  sizeContinuousStyle
} from '../style';
import { hexToRgb } from '../style/helpers/utils';
import * as pointData from './data-mocks/points.json';
import * as lineData from './data-mocks/lines.json';
import * as polygonData from './data-mocks/polygons.json';

document.body.innerHTML = `
  <as-legend-color-bins id="colorBinsEl"></as-legend-color-bins>
  <as-legend-color-category id="colorCategoryEl"></as-legend-color-category>
  <as-legend-color-category id="colorCategoryEl2"></as-legend-color-category>
  <as-legend-color-category id="colorCategoryEl3"></as-legend-color-category>
  <as-legend-color-continuous id="colorContinuousEl"></as-legend-color-continuous>
  <as-legend-color-continuous id="colorContinuousEl2"></as-legend-color-continuous>
  <as-legend-size-bins id="sizeBinsEl"></as-legend-size-bins>
  <as-legend-size-bins id="sizeBinsEl2"></as-legend-size-bins>
  <as-legend-size-bins id="sizeBinsEl3"></as-legend-size-bins>
  <as-legend-size-category id="sizeCategoryEl"></as-legend-size-category>
  <as-legend-size-category id="sizeCategoryEl2"></as-legend-size-category>
  <as-legend-size-continuous id="sizeContinuousEl"></as-legend-size-continuous>
  <as-legend-size-continuous id="sizeContinuousEl2"></as-legend-size-continuous>
`;

describe('Legend', () => {
  let deckInstanceMock: Deck;
  let pointLayer: Layer;
  let lineLayer: Layer;
  let polygonLayer: Layer;

  const POINT_NUMERIC_FIELD = 'region_no';
  const POLYGON_NUMERIC_FIELD = 'pop_est';
  const CATEGORY_FIELD = 'country';

  beforeEach(async () => {
    const deck = {
      props: {
        layers: []
      },
      setProps: null as unknown
    };
    deck.setProps = jest.fn().mockImplementation(props => {
      deck.props = { ...props };
    });

    deckInstanceMock = (deck as unknown) as Deck;

    const pointSource = new GeoJSONSource(
      pointData as FeatureCollection<Geometry, GeoJsonProperties>
    );
    pointLayer = new Layer(pointSource);
    await pointLayer.addTo(deckInstanceMock);
    spyOn(pointLayer, 'isReady').and.returnValue(true);

    const lineSource = new GeoJSONSource(
      lineData as FeatureCollection<Geometry, GeoJsonProperties>
    );
    lineLayer = new Layer(lineSource);
    await lineLayer.addTo(deckInstanceMock);
    spyOn(lineLayer, 'isReady').and.returnValue(true);

    const polygonSource = new GeoJSONSource(
      polygonData as FeatureCollection<Geometry, GeoJsonProperties>
    );
    polygonLayer = new Layer(polygonSource);
    await polygonLayer.addTo(deckInstanceMock);
    spyOn(polygonLayer, 'isReady').and.returnValue(true);
  });

  describe('Legend creation', () => {
    it('should create a legend properly', () => {
      expect(() => new LegendWidget('#colorBinsEl', pointLayer)).not.toThrow();
    });

    it('should thrown an error due to invalid element', () => {
      expect(() => new LegendWidget('#fakeElement', pointLayer)).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Element passed to Legend is not valid'
        })
      );
    });

    it('should thrown an error due to invalid format', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => new LegendWidget('#colorBinsEl', pointLayer, { format: 'invalid' })).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, format must be a function'
        })
      );
    });

    it('should thrown an error due to invalid dynamic', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => new LegendWidget('#colorBinsEl', pointLayer, { dynamic: 'invalid' })).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, dynamic must be a boolean'
        })
      );
    });

    it('should thrown an error due to invalid config', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => new LegendWidget('#colorBinsEl', pointLayer, { config: 'invalid' })).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, config must be an object'
        })
      );
    });

    it('should thrown an error due to invalid othersLabel', () => {
      expect(
        () =>
          new LegendWidget('#colorBinsEl', pointLayer, {
            config: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              othersLabel: {}
            }
          })
      ).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, othersLabel must be a string'
        })
      );
    });

    it('should thrown an error due to invalid order', () => {
      expect(
        () =>
          new LegendWidget('#colorBinsEl', pointLayer, {
            config: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              order: 'ASCDD'
            }
          })
      ).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, order must be ASC or DESC'
        })
      );
    });

    it('should thrown an error due to invalid samples', () => {
      expect(
        () =>
          new LegendWidget('#colorBinsEl', pointLayer, {
            config: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              samples: 'a'
            }
          })
      ).toThrow(
        new CartoError({
          type: '[Legend]',
          message: 'Options passed to Legend are not valid, samples must be a number'
        })
      );
    });
  });

  describe('Legends by styles', () => {
    describe('basic legend', () => {
      it('should have the right geometry type', () => {
        // point
        const colorBinsEl = queryDOMElement('#colorBinsEl');
        Object.defineProperty(colorBinsEl, 'data', {
          set: ([{ type }]: LegendProperties[]) => {
            expect(type).toBe('point');
          }
        });
        new LegendWidget('#colorBinsEl', pointLayer);

        // line
        const colorCategoryEl = queryDOMElement('#colorCategoryEl');
        Object.defineProperty(colorCategoryEl, 'data', {
          set: ([{ type }]: LegendProperties[]) => {
            expect(type).toBe('line');
          }
        });
        new LegendWidget('#colorCategoryEl', lineLayer);

        // polygon
        const sizeBinsEl = queryDOMElement('#sizeBinsEl');
        Object.defineProperty(sizeBinsEl, 'data', {
          set: ([{ type }]: LegendProperties[]) => {
            expect(type).toBe('polygon');
          }
        });
        new LegendWidget('#sizeBinsEl', polygonLayer);
      });

      it('should have the default properties', () => {
        const colorBinsEl = queryDOMElement('#colorBinsEl');
        Object.defineProperty(colorBinsEl, 'data', {
          set: ([{ type, color, strokeColor, width }]: LegendProperties[]) => {
            expect(type).toBe('point');
            expect(color).toBe(hexToRgba(defaultStyles.Point.color));
            expect(strokeColor).toBe(hexToRgba(defaultStyles.Point.strokeColor));
            expect(width).toBe(defaultStyles.Point.size);
          },
          configurable: true
        });
        new LegendWidget('#colorBinsEl', pointLayer);
      });
    });

    describe('colorBins legend', () => {
      it('should have the default properties', async () => {
        const colorBins = colorBinsStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(colorBins);
        const colorBinsStyleProps = await colorBins.getLayerProps(pointLayer);
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const maxColor = (colorBinsStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const minColor = (colorBinsStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const colorBinsEl = queryDOMElement('#colorBinsEl');
        Object.defineProperty(colorBinsEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(5);
            expect(type).toBe('point');
            expect(hexToRgba(color)).toBe(rgbaArrayToString(maxColor));
            expect(hexToRgba(legendProperties[legendProperties.length - 1].color)).toBe(
              rgbaArrayToString(minColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(colorBinsStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(colorBinsStyleProps.getRadius);
          },
          configurable: true
        });
        new LegendWidget('#colorBinsEl', pointLayer);
      });

      it('should have the provided properties', async () => {
        const colorBins = colorBinsStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(colorBins);
        const colorBinsStyleProps = await colorBins.getLayerProps(pointLayer);
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const maxColor = (colorBinsStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const minColor = (colorBinsStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const colorBinsEl = queryDOMElement('#colorBinsEl');
        Object.defineProperty(colorBinsEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(5);
            expect(type).toBe('point');
            expect(label).toBe('x - x');
            expect(hexToRgba(color)).toBe(rgbaArrayToString(minColor));
            expect(hexToRgba(legendProperties[legendProperties.length - 1].color)).toBe(
              rgbaArrayToString(maxColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(colorBinsStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(colorBinsStyleProps.getRadius);
          },
          configurable: true
        });
        new LegendWidget('#colorBinsEl', pointLayer, {
          format: () => 'x',
          config: {
            order: 'ASC'
          }
        });
      });
    });

    describe('colorCategory legend', () => {
      it('should have the default properties', async () => {
        const colorCategories = colorCategoriesStyle(CATEGORY_FIELD);
        await pointLayer.setStyle(colorCategories);
        const categoryFeature = {
          properties: { [CATEGORY_FIELD]: 'KR' }
        };
        const colorCategoriesStyleProps = await colorCategories.getLayerProps(pointLayer);
        const categoryColor = (colorCategoriesStyleProps.getFillColor as (d: any) => RGBAColor)(
          categoryFeature
        );
        const colorCategoryEl = queryDOMElement('#colorCategoryEl2');
        Object.defineProperty(colorCategoryEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(12);
            expect(type).toBe('point');
            expect(label).toBe(categoryFeature.properties[CATEGORY_FIELD]);
            expect(color).toBe(rgbaArrayToString(categoryColor));
            expect(strokeColor).toBe(
              rgbaArrayToString(colorCategoriesStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(defaultStyles.Point.size);
          }
        });
        new LegendWidget('#colorCategoryEl2', pointLayer);
      });

      it('should have the provided properties', async () => {
        const colorCategories = colorCategoriesStyle(CATEGORY_FIELD);
        await pointLayer.setStyle(colorCategories);
        const categoryFeature = {
          properties: { [CATEGORY_FIELD]: 'KR' }
        };
        const colorCategoriesStyleProps = await colorCategories.getLayerProps(pointLayer);
        const categoryColor = (colorCategoriesStyleProps.getFillColor as (d: any) => RGBAColor)(
          categoryFeature
        );
        const colorCategoryEl = queryDOMElement('#colorCategoryEl3');
        const othersLabel = 'Custom other label';
        Object.defineProperty(colorCategoryEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(12);
            expect(type).toBe('point');
            expect(label).toBe(categoryFeature.properties[CATEGORY_FIELD]);
            expect(color).toBe(rgbaArrayToString(categoryColor));
            expect(strokeColor).toBe(
              rgbaArrayToString(colorCategoriesStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(defaultStyles.Point.size);
            expect(legendProperties[legendProperties.length - 1].label).toBe(othersLabel);
          }
        });
        new LegendWidget('#colorCategoryEl3', pointLayer, {
          config: {
            othersLabel
          }
        });
      });
    });

    describe('colorContinuous legend', () => {
      it('should have the default properties', async () => {
        const colorContinuous = colorContinuousStyle(POLYGON_NUMERIC_FIELD);
        await polygonLayer.setStyle(colorContinuous);
        const colorContinuousStyleProps = await colorContinuous.getLayerProps(polygonLayer);
        const maxVal = (polygonLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxColor = (colorContinuousStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POLYGON_NUMERIC_FIELD]: maxVal }
        });
        const minVal = (polygonLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minColor = (colorContinuousStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POLYGON_NUMERIC_FIELD]: minVal }
        });
        const colorContinuousEl = queryDOMElement('#colorContinuousEl');
        Object.defineProperty(colorContinuousEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, label, color, strokeColor }] = legendProperties;
            expect(legendProperties.length).toBe(10);
            expect(type).toBe('polygon');
            expect(label).toBe(maxVal);
            expect(legendProperties[legendProperties.length - 1].label).toBe(minVal);
            expect(color).toBe(rgbaArrayToString(maxColor));
            expect(legendProperties[legendProperties.length - 1].color).toBe(
              rgbaArrayToString(minColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(colorContinuousStyleProps.getLineColor as RGBAColor)
            );
          }
        });
        new LegendWidget('#colorContinuousEl', polygonLayer);
      });

      it('should have the provided properties', async () => {
        const colorContinuous = colorContinuousStyle(POLYGON_NUMERIC_FIELD);
        await polygonLayer.setStyle(colorContinuous);
        const colorContinuousStyleProps = await colorContinuous.getLayerProps(polygonLayer);
        const minVal = (polygonLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minColor = (colorContinuousStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POLYGON_NUMERIC_FIELD]: minVal }
        });
        const maxVal = (polygonLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxColor = (colorContinuousStyleProps.getFillColor as (d: any) => RGBAColor)({
          properties: { [POLYGON_NUMERIC_FIELD]: maxVal }
        });
        const colorContinuousEl = queryDOMElement('#colorContinuousEl2');
        const samples = 3;
        Object.defineProperty(colorContinuousEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, label, color, strokeColor }] = legendProperties;
            expect(legendProperties.length).toBe(samples);
            expect(type).toBe('polygon');
            expect(label).toBe(`${minVal} habs`);
            expect(legendProperties[legendProperties.length - 1].label).toBe(`${maxVal} habs`);
            expect(color).toBe(rgbaArrayToString(minColor));
            expect(legendProperties[legendProperties.length - 1].color).toBe(
              rgbaArrayToString(maxColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(colorContinuousStyleProps.getLineColor as RGBAColor)
            );
          }
        });
        new LegendWidget('#colorContinuousEl2', polygonLayer, {
          format: val => `${val} habs`,
          config: {
            order: 'ASC',
            samples
          }
        });
      });
    });

    describe('sizeBins legend', () => {
      it('should have the default properties', async () => {
        const sizeBins = sizeBinsStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(sizeBins);
        const sizeBinsStyleProps = await sizeBins.getLayerProps(pointLayer);
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxRadius = (sizeBinsStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minRadius = (sizeBinsStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const sizeBinsEl = queryDOMElement('#sizeBinsEl2');
        Object.defineProperty(sizeBinsEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(5);
            expect(type).toBe('point');
            expect(color).toBe(rgbaArrayToString(sizeBinsStyleProps.getFillColor as RGBAColor));
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeBinsStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(maxRadius);
            expect(legendProperties[legendProperties.length - 1].width).toBe(minRadius);
          }
        });
        new LegendWidget('#sizeBinsEl2', pointLayer);
      });

      it('should have the provided properties', async () => {
        const sizeBins = sizeBinsStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(sizeBins);
        const sizeBinsStyleProps = await sizeBins.getLayerProps(pointLayer);
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minRadius = (sizeBinsStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxRadius = (sizeBinsStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const sizeBinsEl = queryDOMElement('#sizeBinsEl3');
        Object.defineProperty(sizeBinsEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(5);
            expect(type).toBe('point');
            expect(label).toBe('x - x');
            expect(color).toBe(rgbaArrayToString(sizeBinsStyleProps.getFillColor as RGBAColor));
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeBinsStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(minRadius);
            expect(legendProperties[legendProperties.length - 1].width).toBe(maxRadius);
          }
        });
        new LegendWidget('#sizeBinsEl3', pointLayer, {
          format: () => 'x',
          config: {
            order: 'ASC'
          }
        });
      });
    });

    describe('sizeCategory legend', () => {
      it('should have the default properties', async () => {
        const sizeCategories = sizeCategoriesStyle(CATEGORY_FIELD);
        await pointLayer.setStyle(sizeCategories);
        const categoryFeature = {
          properties: { [CATEGORY_FIELD]: 'KR' }
        };
        const sizeCategoriesStyleProps = await sizeCategories.getLayerProps(pointLayer);
        const maxRadius = (sizeCategoriesStyleProps.getRadius as (d: any) => number)(
          categoryFeature
        );
        const sizeCategoryEl = queryDOMElement('#sizeCategoryEl');
        Object.defineProperty(sizeCategoryEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(12);
            expect(type).toBe('point');
            expect(label).toBe(categoryFeature.properties[CATEGORY_FIELD]);
            expect(color).toBe(
              rgbaArrayToString(sizeCategoriesStyleProps.getFillColor as RGBAColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeCategoriesStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(maxRadius);
          }
        });
        new LegendWidget('#sizeCategoryEl', pointLayer);
      });

      it('should have the provided properties', async () => {
        const sizeCategories = sizeCategoriesStyle(CATEGORY_FIELD);
        await pointLayer.setStyle(sizeCategories);
        const categoryFeature = {
          properties: { [CATEGORY_FIELD]: 'KR' }
        };
        const sizeCategoriesStyleProps = await sizeCategories.getLayerProps(pointLayer);
        const maxRadius = (sizeCategoriesStyleProps.getRadius as (d: any) => number)(
          categoryFeature
        );
        const sizeCategoryEl = queryDOMElement('#sizeCategoryEl2');
        const othersLabel = 'Custom other label';
        Object.defineProperty(sizeCategoryEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, color, label, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(12);
            expect(type).toBe('point');
            expect(label).toBe(categoryFeature.properties[CATEGORY_FIELD]);
            expect(color).toBe(
              rgbaArrayToString(sizeCategoriesStyleProps.getFillColor as RGBAColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeCategoriesStyleProps.getLineColor as RGBAColor)
            );
            expect(width).toBe(maxRadius);
            expect(legendProperties[legendProperties.length - 1].label).toBe(othersLabel);
          }
        });
        new LegendWidget('#sizeCategoryEl2', pointLayer, {
          config: {
            othersLabel
          }
        });
      });
    });

    describe('sizeContinuous legend', () => {
      it('should have the default properties', async () => {
        const sizeContinuous = sizeContinuousStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(sizeContinuous);
        const sizeContinuousStyleProps = await sizeContinuous.getLayerProps(pointLayer);
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxRadius = (sizeContinuousStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minRadius = (sizeContinuousStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const sizeContinuousEl = queryDOMElement('#sizeContinuousEl');
        Object.defineProperty(sizeContinuousEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, label, color, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(4);
            expect(type).toBe('point');
            expect(label).toBe(maxVal);
            expect(legendProperties[legendProperties.length - 1].label).toBe(minVal);
            expect(width).toBe(maxRadius);
            expect(legendProperties[legendProperties.length - 1].width).toBe(minRadius);
            expect(color).toBe(
              rgbaArrayToString(sizeContinuousStyleProps.getFillColor as RGBAColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeContinuousStyleProps.getLineColor as RGBAColor)
            );
          }
        });
        new LegendWidget('#sizeContinuousEl', pointLayer);
      });

      it('should have the provided properties', async () => {
        const sizeContinuous = sizeContinuousStyle(POINT_NUMERIC_FIELD);
        await pointLayer.setStyle(sizeContinuous);
        const sizeContinuousStyleProps = await sizeContinuous.getLayerProps(pointLayer);
        const minVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).min;
        const minRadius = (sizeContinuousStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: minVal }
        });
        const maxVal = (pointLayer.source.getMetadata().stats[0] as NumericFieldStats).max;
        const maxRadius = (sizeContinuousStyleProps.getRadius as (d: any) => number)({
          properties: { [POINT_NUMERIC_FIELD]: maxVal }
        });
        const sizeContinuousEl = queryDOMElement('#sizeContinuousEl2');
        const samples = 3;
        Object.defineProperty(sizeContinuousEl, 'data', {
          set: (legendProperties: LegendProperties[]) => {
            const [{ type, label, color, strokeColor, width }] = legendProperties;
            expect(legendProperties.length).toBe(samples);
            expect(type).toBe('point');
            expect(label).toBe(`${minVal} reg`);
            expect(legendProperties[legendProperties.length - 1].label).toBe(`${maxVal} reg`);
            expect(width).toBe(minRadius);
            expect(legendProperties[legendProperties.length - 1].width).toBe(maxRadius);
            expect(color).toBe(
              rgbaArrayToString(sizeContinuousStyleProps.getFillColor as RGBAColor)
            );
            expect(strokeColor).toBe(
              rgbaArrayToString(sizeContinuousStyleProps.getLineColor as RGBAColor)
            );
          }
        });
        new LegendWidget('#sizeContinuousEl2', pointLayer, {
          format: val => `${val} reg`,
          config: {
            order: 'ASC',
            samples
          }
        });
      });
    });
  });
});

function hexToRgba(hex?: string) {
  return hex ? rgbaArrayToString(hexToRgb(hex)) : undefined;
}

function rgbaArrayToString(colors: RGBAColor) {
  return `rgba(${colors.join(',')})`;
}
