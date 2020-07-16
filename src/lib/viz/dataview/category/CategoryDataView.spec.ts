import { Client } from '@/maps/Client';
import { Deck } from '@deck.gl/core';
import { Layer } from '../../layer/Layer';
import { CategoryDataView } from './CategoryDataView';
import { AggregationType } from '../../../data/operations/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewCalculation } from '../mode/DataViewMode';

describe('DataView', () => {
  describe('Instance Creation', () => {
    it('should create new DataView instance', () => {
      expect(
        () =>
          new CategoryDataView(new Layer('fake_source'), 'fake_column', {
            operation: AggregationType.AVG,
            operationColumn: 'popEst',
            mode: DataViewCalculation.FAST
          })
      ).not.toThrow();
    });

    it('should throw an exception when operation is not provided', () => {
      expect(
        () =>
          new CategoryDataView(new Layer('fake_source'), 'fake_column', {
            operation: undefined as never,
            operationColumn: 'fake_operation_column',
            mode: DataViewCalculation.FAST
          })
      ).toThrow(
        new CartoDataViewError(
          'Operation property not provided while creating dataview. Please check documentation.',
          dataViewErrorTypes.PROPERTY_MISSING
        )
      );
    });

    it('should throw an exception when operationColumn is not provided', () => {
      expect(
        () =>
          new CategoryDataView(new Layer('fake_source'), 'fake_column', {
            operation: AggregationType.AVG,
            operationColumn: undefined as never,
            mode: DataViewCalculation.FAST
          })
      ).toThrow(
        new CartoDataViewError(
          'Operation column property not provided while creating dataview. Please check documentation.',
          dataViewErrorTypes.PROPERTY_MISSING
        )
      );
    });

    it('should create an instance with COUNT operation although the operationColumn is not provided', () => {
      expect(
        () =>
          new CategoryDataView(new Layer('fake_source'), 'fake_column', {
            operation: AggregationType.COUNT,
            mode: DataViewCalculation.FAST
          })
      ).not.toThrow();
    });
  });

  describe('getData', () => {
    let instantiateMapFromMock: jest.Mock;
    let deckInstanceMock: Deck;

    beforeEach(() => {
      instantiateMapFromMock = jest.fn().mockImplementation(() => {
        return {
          metadata: {
            url: {
              vector: {
                urlTemplate: '{s}.carto.com',
                subdomains: []
              }
            },
            layers: [
              {
                meta: {
                  stats: {
                    geometryType: 'Point',
                    columns: {
                      country: {
                        type: 'string',
                        categories: []
                      },
                      popEst: {
                        type: 'number',
                        categories: []
                      }
                    }
                  }
                }
              }
            ]
          }
        };
      });
      Client.prototype.instantiateMapFrom = instantiateMapFromMock;

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
    });
    it('should return categories and stats grouped by column', async () => {
      const sourceDataToGroup = [
        { country: 'Country 2', popEst: 10 },
        { country: 'Country 2', popEst: 20 },
        { country: 'Country 4', popEst: 30 },
        { country: 'Country 4', popEst: 40 },
        { country: 'Country 5', popEst: 50 }
      ];

      const layer = new Layer('fake_source');
      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceDataToGroup));

      const dataView = new CategoryDataView(layer, 'country', {
        operation: AggregationType.AVG,
        operationColumn: 'popEst',
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        categories: [
          { name: 'Country 5', value: 50 },
          { name: 'Country 4', value: 35 },
          { name: 'Country 2', value: 15 }
        ],
        count: 3,
        operation: AggregationType.AVG,
        max: 50,
        min: 15,
        nullCount: 0
      });
    });

    it('should return the number of features grouped by category', async () => {
      const sourceDataToGroup = [
        { country: 'Country 5', popEst: 50 },
        { country: 'Country 4', popEst: 40 },
        { country: 'Country 4', popEst: 30 },
        { country: 'Country 2', popEst: 20 },
        { country: 'Country 2', popEst: 10 }
      ];

      const layer = new Layer('fake_source');
      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceDataToGroup));

      const dataView = new CategoryDataView(layer, 'country', {
        operation: AggregationType.COUNT,
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        categories: [
          { name: 'Country 2', value: 2 },
          { name: 'Country 4', value: 2 },
          { name: 'Country 5', value: 1 }
        ],
        count: 3,
        operation: AggregationType.COUNT,
        max: 2,
        min: 1,
        nullCount: 0
      });
    });

    it('should send the aggregation parameters to the Maps API', async () => {
      const layer = new Layer('fake_source');

      // eslint-disable-next-line no-new
      new CategoryDataView(layer, 'country', {
        operation: AggregationType.SUM,
        operationColumn: 'popEst'
      });
      await await layer.addTo(deckInstanceMock);

      const expectedmapConfig = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 2048,
        bufferSize: {
          mvt: 10
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 32768,
            includeNulls: true
          },
          dimensions: true,
          sample: {
            num_rows: 1000,
            include_columns: ['country']
          }
        },
        aggregation: {
          columns: {},
          dimensions: {
            country: {
              column: 'country'
            }
          },
          placement: 'centroid',
          resolution: 1,
          threshold: 1
        },
        sql: `SELECT * FROM fake_source`
      };

      expect(instantiateMapFromMock.mock.calls[0][0]).toStrictEqual(expectedmapConfig);
    });

    it('should return the sum of popEst grouped by category from aggregated data', async () => {
      const aggregatedData = [
        { country: 'Country 5', _cdb_sum__popEst: 50 },
        { country: 'Country 4', _cdb_sum__popEst: 40 },
        { country: 'Country 4', _cdb_sum__popEst: 30 },
        { country: 'Country 2', _cdb_sum__popEst: 20 },
        { country: 'Country 2', _cdb_sum__popEst: 10 }
      ];

      const layer = new Layer('fake_source');
      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(aggregatedData));

      const dataView = new CategoryDataView(layer, 'country', {
        operation: AggregationType.SUM,
        operationColumn: 'popEst',
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        categories: [
          { name: 'Country 4', value: 70 },
          { name: 'Country 5', value: 50 },
          { name: 'Country 2', value: 30 }
        ],
        count: 3,
        operation: AggregationType.SUM,
        max: 70,
        min: 30,
        nullCount: 0
      });
    });
  });
});
