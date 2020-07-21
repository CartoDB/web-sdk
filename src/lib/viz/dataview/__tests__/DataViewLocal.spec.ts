import { Layer } from '@/viz/layer';
import { DataViewLocal } from '../mode/DataViewLocal';

describe('DataViewMode', () => {
  describe('.addFilter', () => {
    it('should allow to override column name in filter', async () => {
      const fakeLayer = ({
        on: jest.fn(),
        addField: jest.fn(),
        addFilter: jest.fn()
      } as unknown) as Layer;

      const dataviewMode = new DataViewLocal(fakeLayer, 'fake_column');

      dataviewMode.addFilter(
        'fake_filter',
        { within: [1, 2] },
        { columnName: 'overridenColumnName' }
      );

      expect(fakeLayer.addFilter).toHaveBeenCalledWith('fake_filter', {
        overridenColumnName: { within: [1, 2] }
      });
    });
  });
});
