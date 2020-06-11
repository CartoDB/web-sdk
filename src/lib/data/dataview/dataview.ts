import { CartoError } from '../../core/errors/CartoError';
import { WithEvents } from '../../core/mixins/WithEvents';
import { Layer } from '../../viz/layer/Layer';
import { CARTOSource } from '../../viz/sources/CARTOSource';
import { AggregationType } from '../operations/aggregation/aggregation';
import { Filter } from './types';

export class DataView extends WithEvents {
  private dataSource: CARTOSource | Layer;
  protected column: string;

  constructor(dataSource: CARTOSource | Layer, column: string) {
    super();
    validateParameters(dataSource, column);

    this.dataSource = dataSource;
    this.column = column;

    this.bindEvents();
  }

  // eslint-disable-next-line class-methods-use-this
  async getData(): Promise<Partial<DataViewData>> {
    throw new CartoError({
      type: `[DataView]`,
      message: 'Method getData is not implemented'
    });
  }

  addFilter(widgetId: string, filter: Filter) {
    this.dataSource.addFilter(widgetId, { [this.column]: filter });
  }

  removeFilter(widgetId: string) {
    this.dataSource.removeFilter(widgetId);
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

  protected getSourceData(columns: string[]) {
    return (this.dataSource as Layer).getViewportFeatures(columns);
  }
}

function validateParameters(source: CARTOSource | Layer, column: string) {
  if (!source) {
    throw new CartoError({
      type: '[DataView]',
      message: 'Source was not provided while creating dataview'
    });
  }

  if (!column) {
    throw new CartoError({
      type: '[DataView]',
      message: 'Column name was not provided while creating dataview'
    });
  }
}

export interface DataViewData {
  result: number;
  categories: {
    name: string;
    value: number;
  }[];
  count: number;
  operation: AggregationType;
  max: number;
  min: number;
  nullCount: number;
}
