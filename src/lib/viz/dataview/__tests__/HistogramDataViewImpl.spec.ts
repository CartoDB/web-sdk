import { HistogramDataViewImpl } from '../histogram/HistogramDataViewImpl';
import { DataViewLocal } from '../mode/DataViewLocal';

describe('HistogramDataViewImpl', () => {
  describe('.addFilter', () => {
    it('should add filter to aggregated column if data is aggregated', async () => {
      const localDataView = ({
        column: 'fake_column',
        addFilter: jest.fn(),
        availableEvents: [],
        getSourceData() {
          return [
            { _cdb_avg__fake_column: 2, _cdb_feature_count: 1 },
            { _cdb_avg__fake_column: 3, _cdb_feature_count: 1 },
            { _cdb_avg__fake_column: 4, _cdb_feature_count: 1 },
            { _cdb_avg__fake_column: 7, _cdb_feature_count: 1 },
            { _cdb_avg__fake_column: 9, _cdb_feature_count: 1 }
          ];
        }
      } as unknown) as DataViewLocal;

      const dataViewImplementation = new HistogramDataViewImpl(localDataView, { bins: 5 });
      await dataViewImplementation.getLocalData({});

      dataViewImplementation.addFilter('fake_filter', { within: [1, 3] });

      expect(localDataView.addFilter).toHaveBeenCalledWith(
        'fake_filter',
        { within: [1, 3] },
        { columnName: '_cdb_avg__fake_column' }
      );
    });
  });
});
