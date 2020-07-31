import { DataView } from '../DataView';
import {
  HistogramDataViewImpl,
  HistogramDataViewOptions,
  HistogramDataViewData
} from './HistogramDataViewImpl';

export class HistogramDataView extends DataView<HistogramDataViewData> {
  protected buildImpl(column: string, options: HistogramDataViewOptions = { bins: 10 }) {
    const dataViewMode = this.createDataViewMode(column, options);
    this.dataviewImpl = new HistogramDataViewImpl(dataViewMode, options);
  }
}
