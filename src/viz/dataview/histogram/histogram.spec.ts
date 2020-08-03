import { Layer } from '@/viz';
import { HistogramDataView } from './HistogramDataView';
import { DataViewCalculation } from '../mode/DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

describe('Histogram DataView', () => {
  describe('Instance Creation', () => {
    it('should create new DataView instance', () => {
      expect(() => new HistogramDataView(new Layer('fake_source'), 'fake_column')).not.toThrow();
    });

    it('should throw when bins property is defined and not an integer', () => {
      expect(
        () =>
          new HistogramDataView(new Layer('fake_source'), 'fake_column', {
            bins: 'fakebins'
          })
      ).toThrow(
        new CartoDataViewError(
          'Bins property value is not valid. Please check documentation.',
          dataViewErrorTypes.PROPERTY_INVALID
        )
      );
    });

    it('should throw when start property is defined and not an integer', () => {
      expect(
        () =>
          new HistogramDataView(new Layer('fake_source'), 'fake_column', {
            bins: 10,
            start: 'fakestart'
          })
      ).toThrow(
        new CartoDataViewError(
          'Start property value is not valid. Please check documentation.',
          dataViewErrorTypes.PROPERTY_INVALID
        )
      );
    });

    it('should throw when end property is defined and not an integer', () => {
      expect(
        () =>
          new HistogramDataView(new Layer('fake_source'), 'fake_column', {
            bins: 10,
            start: 1,
            end: 'fakeend'
          })
      ).toThrow(
        new CartoDataViewError(
          'End property value is not valid. Please check documentation.',
          dataViewErrorTypes.PROPERTY_INVALID
        )
      );
    });

    it('should throw when start and end properties are defined but start is greater than end', () => {
      expect(
        () =>
          new HistogramDataView(new Layer('fake_source'), 'fake_column', {
            bins: 10,
            start: 1,
            end: 0
          })
      ).toThrow(
        new CartoDataViewError(
          'Start should be greater than end. Please check documentation.',
          dataViewErrorTypes.PROPERTY_INVALID
        )
      );
    });
  });

  describe('getData', () => {
    it('should return rows grouped in bins', async () => {
      const sourceDataToGroup = [
        { country: 'Country 2', popEst: 10 },
        { country: 'Country 2', popEst: 20 },
        { country: 'Country 4', popEst: null },
        { country: 'Country 4', popEst: 40 },
        { country: 'Country 5', popEst: 50 }
      ];

      const layer = new Layer('fake_source');
      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceDataToGroup));

      const dataView = new HistogramDataView(layer, 'popEst', {
        bins: 2,
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        bins: [
          {
            avg: 15,
            bin: 0,
            end: 25,
            max: 20,
            min: 10,
            normalized: 0.4,
            start: 0,
            value: 2
          },
          {
            avg: 40,
            bin: 1,
            end: 50,
            max: 40,
            min: 40,
            normalized: 0.2,
            start: 25,
            value: 1
          }
        ],
        nulls: 1,
        totalAmount: 5
      });
    });

    it('should accept custom start and end values for bins range', async () => {
      const sourceDataToGroup = [
        { country: 'Country 5', popEst: 50 },
        { country: 'Country 4', popEst: 40 },
        { country: 'Country 4', popEst: 30 },
        { country: 'Country 2', popEst: 20 },
        { country: 'Country 2', popEst: 10 }
      ];

      const layer = new Layer('fake_source');
      spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceDataToGroup));

      const dataView = new HistogramDataView(layer, 'popEst', {
        bins: 2,
        start: 20,
        end: 50,
        mode: DataViewCalculation.FAST
      });

      expect(await dataView.getData()).toMatchObject({
        bins: [
          {
            avg: 25,
            bin: 0,
            end: 35,
            max: 30,
            min: 20,
            normalized: 0.4,
            start: 20,
            value: 2
          },
          {
            avg: 40,
            bin: 1,
            end: 50,
            max: 40,
            min: 40,
            normalized: 0.2,
            start: 35,
            value: 1
          }
        ],
        nulls: 0,
        totalAmount: 5
      });
    });
  });
});
