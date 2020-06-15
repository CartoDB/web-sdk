import { Layer } from '@/viz';
import { DataViewMode } from './DataViewMode';

export class DataViewLocal extends DataViewMode<Layer> {
  constructor(dataSource: Layer, column: string) {
    super(dataSource, column);

    this.bindEvents();
  }

  public getSourceData(columns: string[]) {
    return this.dataSource.getViewportFeatures([this.column, ...columns]);
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate']);

    if (this.dataSource instanceof Layer) {
      this.dataSource.on('viewportLoad', () => {
        this.onDataUpdate();
      });
    }
  }

  private onDataUpdate() {
    this.emitter.emit('dataUpdate');
  }
}
