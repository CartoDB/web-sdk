import { Layer } from '../../layer/Layer';
import { FormulaDataView } from './FormulaDataView';
import { AggregationType } from '../../../data/operations/aggregation';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewCalculation } from '../mode/DataViewMode';

describe('FormulaDataView', () => {
  describe('Instance Creation', () => {
    it('should create new DataView instance', () => {
      expect(
        () =>
          new FormulaDataView(new Layer('fake_source'), 'fake_column', {
            operation: AggregationType.AVG,
            mode: DataViewCalculation.FAST
          })
      ).not.toThrow();
    });

    it('should throw an exception when operation is not provided', () => {
      expect(
        () =>
          new FormulaDataView(new Layer('fake_source'), 'fake_column', {
            operation: undefined as never,
            mode: DataViewCalculation.FAST
          })
      ).toThrow(
        new CartoDataViewError(
          'Operation property not provided while creating dataview. Please check documentation.',
          dataViewErrorTypes.PROPERTY_MISSING
        )
      );
    });
  });

  describe('getData', () => {
    it('should return categories and stats grouped by column', async () => {
      const layer = new Layer('fake_source');

      const sourceData = [
        { id: '1', pop: 10 },
        { id: '2', pop: 20 },
        { id: '3', pop: 30 },
        { id: '4', pop: 40 },
        { id: '5', pop: null },
        { id: '6', pop: undefined },
        { id: '7', pop: 50 },
        { id: '8', pop: 90 }
      ];

      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceData));

      const dataView = new FormulaDataView(layer, 'pop', {
        operation: AggregationType.AVG,
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        result: 40,
        operation: AggregationType.AVG,
        nullCount: 2
      });
    });

    it('should validate features have numbers in the column', async () => {
      const layer = new Layer('fake_source');

      const sourceData = [
        { id: '1', pop: null },
        { id: '2', pop: null },
        { id: '3', pop: '30' },
        { id: '4', pop: '40,5' },
        { id: '5', pop: '31.2' }
      ];

      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceData));

      const dataView = new FormulaDataView(layer, 'pop', {
        operation: AggregationType.SUM,
        mode: DataViewCalculation.FAST
      });

      try {
        await dataView.getData();
      } catch (error) {
        expect(error).toMatchObject(
          new CartoDataViewError(
            `Column property for Formula can just contain numbers (or nulls) and a string with 30 value was found. Please check documentation.`,
            dataViewErrorTypes.PROPERTY_INVALID
          )
        );
      }
    });
  });
});
