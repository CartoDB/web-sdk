import { AggregationType } from '@/data/operations/aggregation';
import { FormulaDataViewImpl } from '../formula/FormulaDataViewImpl';
import { DataViewLocal } from '../mode/DataViewLocal';

describe('FormulaDataViewImpl', () => {
  describe('.addFilter', () => {
    it('should add filter to aggregated column if data is aggregated', async () => {
      const localDataView = ({
        column: 'fake_column',
        addFilter: jest.fn(),
        availableEvents: [],
        getSourceData() {
          return [{ _cdb_avg__fake_column: 2, _cdb_feature_count: 1 }];
        }
      } as unknown) as DataViewLocal;

      const dataViewImplementation = new FormulaDataViewImpl(localDataView, {
        operation: AggregationType.AVG
      });
      await dataViewImplementation.getLocalData();

      dataViewImplementation.addFilter('fake_filter', { within: [1, 3] });

      expect(localDataView.addFilter).toHaveBeenCalledWith(
        'fake_filter',
        { within: [1, 3] },
        { columnName: '_cdb_avg__fake_column' }
      );
    });
  });
});
