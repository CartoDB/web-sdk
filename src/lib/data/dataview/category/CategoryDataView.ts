import { WithEvents } from '@/core/mixins/WithEvents';
import { Layer } from '@/viz/layer/Layer';
import { CARTOSource } from '@/viz/sources/CARTOSource';
import { DataView } from '../dataview';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { CategoryBase, DataViewMode, CategoryOptions } from './CategoryBase';
import { Source } from '../Source';
import { Viewport } from '../Viewport';
import { CategorySource } from './CategorySource';
import { CategoryViewport } from './CategoryViewport';
import { CategoryMixed } from './CategoryMixed';

export class CategoryDataView extends WithEvents {
  private categoryWrappee: CategoryBase<DataView<Layer | string>>;

  constructor(dataSource: Layer | string, column: string, options: CategoryOptions) {
    super();

    const mode = options.mode || DataViewMode.MIXED;
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
  dataSource: Layer | string,
  column: string,
  options: CategoryOptions,
  mode: DataViewMode
) {
  let categoryWrappee;

  switch (mode) {
    case DataViewMode.SOURCE: {
      let sourceName;

      if (typeof dataSource === 'string') {
        sourceName = dataSource;
      } else {
        const layerSource = (dataSource as Layer).source;
        sourceName = (layerSource as CARTOSource).value;
      }

      const source = new Source(sourceName, column);
      categoryWrappee = new CategorySource(source, options);
      break;
    }

    case DataViewMode.VIEWPORT: {
      if (typeof dataSource === 'string') {
        throw new CartoDataViewError(
          `The provided source has to be an instance of Layer when the ${DataViewMode.VIEWPORT} mode is used.`,
          dataViewErrorTypes.PROPERTY_INVALID
        );
      }

      const viewport = new Viewport(dataSource, column);
      categoryWrappee = new CategoryViewport(viewport, options);
      break;
    }

    default: {
      if (typeof dataSource === 'string') {
        throw new CartoDataViewError(
          'The provided source has to be an instance of Layer or CARTOSource',
          dataViewErrorTypes.PROPERTY_INVALID
        );
      }

      const layerSource = (dataSource as Layer).source;
      const sourceName = (layerSource as CARTOSource).value;

      const source = new Source(sourceName, column);
      const viewport = new Viewport(dataSource, column);
      categoryWrappee = new CategoryMixed(source, viewport, options);
      break;
    }
  }

  return categoryWrappee;
}
