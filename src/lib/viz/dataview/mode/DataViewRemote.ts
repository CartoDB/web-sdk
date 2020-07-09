import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { Filter, SpatialFilters, BuiltInFilters, ColumnFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { DataViewMode, DataViewCalculation } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewMode {
  private _dataviewsApi: DataviewsApi;
  private _remoteSource: SQLSource | DatasetSource;

  private filtersCollection = new FiltersCollection<SpatialFilters, RemoteFilterApplicator>(
    RemoteFilterApplicator
  );

  constructor(dataSource: Layer | Source, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    const remoteSource = getRemoteSource(dataSource);
    this._remoteSource = remoteSource;
    this._dataviewsApi = new DataviewsApi(remoteSource.value, credentials);

    this.bindEvents();
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate', 'error']);

    this._remoteSource.on('filterChange', () => {
      this.onDataUpdate();
    });
  }

  public get dataviewsApi() {
    return this._dataviewsApi;
  }

  public getFilterApplicator() {
    return this.filtersCollection.getApplicatorInstance() as RemoteFilterApplicator;
  }

  public addFilter(filterId: string, filter: Filter | BuiltInFilters | ColumnFilters) {
    if (filter === BuiltInFilters.VIEWPORT) {
      this.createViewportSpatialFilter(filterId);
      return;
    }

    super.addFilter(filterId, filter as ColumnFilters);
    this._remoteSource.addFilter(filterId, { [this.column]: filter });
  }

  public removeFilter(filterId: string) {
    super.removeFilter(filterId);
    this._remoteSource.removeFilter(filterId);
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

  public updateDataViewSource(options: { filterId: string }) {
    const filterOptions = options.filterId ? [options.filterId] : [];

    const sql = this._remoteSource.getSQLWithFilters(filterOptions);
    this.dataviewsApi.setSource(sql);
  }
}

function getRemoteSource(dataSource: Layer | Source) {
  if (dataSource instanceof Source) {
    // TODO what about the other sources? Check DOSource and its instantiation process
    return dataSource as SQLSource | DatasetSource;
  }

  const layer = dataSource as Layer;
  return layer.source as SQLSource | DatasetSource;
}
