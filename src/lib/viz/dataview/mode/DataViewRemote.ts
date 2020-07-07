import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { Filter, SpatialFilters, BuiltInFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { DataViewMode, DataViewCalculation } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewMode {
  private _dataviewsApi: DataviewsApi;

  private filtersCollection = new FiltersCollection<SpatialFilters, RemoteFilterApplicator>(
    RemoteFilterApplicator
  );

  constructor(dataSource: Layer | Source, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    const dataset = getDatasetName(dataSource);
    this._dataviewsApi = new DataviewsApi(dataset, credentials);

    this.registerAvailableEvents(['dataUpdate', 'error']);
  }

  public get dataviewsApi() {
    return this._dataviewsApi;
  }

  public getFilterApplicator() {
    return this.filtersCollection.getApplicatorInstance() as RemoteFilterApplicator;
  }

  public addFilter(filterId: string, filter: Filter | BuiltInFilters) {
    if (filter === BuiltInFilters.VIEWPORT) {
      this.createViewportSpatialFilter(filterId);
    } else {
      this.dataSource.addFilter(filterId, { [this.column]: filter });
    }
  }

  private createViewportSpatialFilter(filterId: string) {
    if (this.dataSource instanceof Source) {
      throw new CartoDataViewError(
        `The ${DataViewCalculation.REMOTE_FILTERED.toString()} mode needs a Layer but a Source was provided`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    this.dataSource.on('viewportLoad', () => {
      const deckInstance = (this.dataSource as Layer).getMapInstance();
      const viewport = deckInstance.getViewports(undefined)[0];

      if (viewport) {
        const nw = viewport.unproject([0, 0]);
        const se = viewport.unproject([viewport.width, viewport.height]);

        const bbox = [nw[0], se[1], se[0], nw[1]];
        this.filtersCollection.removeFilter(filterId);
        this.filtersCollection.addFilter(filterId, { within: bbox });
        this.emit('dataUpdate');
      }
    });
  }
}

function getDatasetName(dataSource: Layer | Source) {
  let source;

  if (dataSource instanceof Source) {
    // TODO what about the other sources?
    source = dataSource as SQLSource | DatasetSource;
  } else {
    const layer = dataSource as Layer;
    source = layer.source as SQLSource | DatasetSource;
  }

  return source.value;
}
