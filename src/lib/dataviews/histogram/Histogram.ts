import { Layer, Source } from '@/viz';
import { BuiltInFilters } from '@/viz/filters/types';
import { uuidv4 } from '@/core/utils/uuid';
import { DataViewCalculation, HistogramDataViewOptions } from '../mode/DataViewMode';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewWrapper } from '../DataViewWrapper';
import { HistogramImpl } from './HistogramImpl';

export class HistogramDataView extends DataViewWrapper {
  protected buildImpl(
    dataSource: Layer | Source,
    column: string,
    options: HistogramDataViewOptions
  ) {
    let dataView;
    const { mode } = options;

    switch (mode) {
      case DataViewCalculation.LOCAL: {
        dataView = new DataViewLocal(dataSource as Layer, column);
        break;
      }

      case DataViewCalculation.REMOTE: {
        dataView = new DataViewRemote(dataSource as Source, column);
        break;
      }

      default: {
        dataView = new DataViewRemote(dataSource as Layer, column);
        dataView.addFilter(`VIEWPORT_FILTER_${uuidv4()}`, BuiltInFilters.VIEWPORT);
        break;
      }
    }

    this.dataviewImpl = new HistogramImpl(dataView, options);
  }
}
