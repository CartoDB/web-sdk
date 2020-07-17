import { Layer, DATA_CHANGED_EVENT } from '../layer/Layer';
import { DataViewLocal } from './mode/DataViewLocal';
import { CartoDataViewError, dataViewErrorTypes } from './DataViewError';

describe('DataView', () => {
  describe('Instance Creation', () => {
    it('should create new DataView instance', () => {
      expect(() => new DataViewLocal(new Layer('fake_source'), 'fake_column')).not.toThrow();
    });

    it('should throw an exception when source is not provided', () => {
      expect(() => new DataViewLocal(undefined as never, 'fake_column')).toThrow(
        new CartoDataViewError(
          'Source was not provided while creating dataview',
          dataViewErrorTypes.PROPERTY_MISSING
        )
      );
    });

    it('should throw an exception when column is not provided', () => {
      expect(() => new DataViewLocal(new Layer('fake_source'), undefined as never)).toThrow(
        new CartoDataViewError(
          'Column name was not provided while creating dataview',
          dataViewErrorTypes.PROPERTY_MISSING
        )
      );
    });
  });

  describe('Events', () => {
    // TODO skip event test, until we figure out a way to manage mitt with ts-jest
    it.skip('dataUpdate', () => {
      const layer = new Layer('fake_source');
      const dataView = new DataViewLocal(layer, 'popEst');

      const dataUpdateSpy = jest.fn();
      dataView.on('dataUpdate', dataUpdateSpy);

      layer.emit(DATA_CHANGED_EVENT);

      expect(dataUpdateSpy).toHaveBeenCalled();
    });
  });
});
