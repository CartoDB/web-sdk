import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer, Source } from '@/viz';
import { DataView } from '../DataViewMode';
import { CategoryBase, DataViewMode, CategoryOptions } from './CategoryBase';
import { DataViewLocal } from '../DataViewLocal';
import { DataViewRemote } from '../DataViewRemote';
import { CategoryLocal } from './CategoryLocal';
import { CategoryRemote } from './CategoryRemote';

export class CategoryDataView extends WithEvents {
  private categoryWrappee: CategoryBase<DataView<Layer | Source>>;

  constructor(dataSource: Layer | Source, column: string, options: CategoryOptions) {
    super();

    const mode = options.mode || DataViewMode.VIEWPORT;
    this.categoryWrappee = buildCategoryWrappee(dataSource, column, options, mode);

    // bind events with the mode
    this.bindEvents();
  }

  public getData() {
    return this.categoryWrappee.getData();
  }

  private bindEvents() {
    const events = this.categoryWrappee.getEvents();
    this.registerAvailableEvents(events);
    events.forEach((e: string) => this.categoryWrappee.on(e, (args: any[]) => this.emit(e, args)));
  }
}

function buildCategoryWrappee(
  dataSource: Layer | Source,
  column: string,
  options: CategoryOptions,
  mode: DataViewMode
) {
  let categoryWrappee;

  switch (mode) {
    case DataViewMode.NON_PRECISE: {
      const dataViewLocal = new DataViewLocal(dataSource as Layer, column);
      categoryWrappee = new CategoryLocal(dataViewLocal, options);
      break;
    }

    case DataViewMode.VIEWPORT: {
      const dataViewRemote = new DataViewRemote(dataSource as Source, column);
      categoryWrappee = new CategoryRemote(dataViewRemote, options);
      break;
    }

    default: {
      const dataViewRemote = new DataViewRemote(dataSource as Source, column);
      categoryWrappee = new CategoryRemote(dataViewRemote, options);
      break;
    }
  }

  return categoryWrappee;
}
