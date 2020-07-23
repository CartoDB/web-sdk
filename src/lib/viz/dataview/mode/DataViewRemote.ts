import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { TILES_LOADED_EVENT } from '@/viz/layer/Layer';
import { Filter, SpatialFilters, ColumnFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { uuidv4 } from '@/core/utils/uuid';
import { DataViewMode } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { GetDataOptions } from '../DataViewImpl';
import { DataViewEvent } from '../utils';

export class DataViewRemote extends DataViewMode {
  private _dataviewsApi: DataviewsApi;
  private _remoteSource: SQLSource | DatasetSource;

  private filtersCollection = new FiltersCollection<SpatialFilters, RemoteFilterApplicator>(
    RemoteFilterApplicator
  );

  constructor(dataOrigin: Layer | Source, column: string, credentials = defaultCredentials) {
    super(dataOrigin, column);

    const remoteSource = getRemoteSource(dataOrigin);
    this._remoteSource = remoteSource;
    this._dataviewsApi = new DataviewsApi(remoteSource.value, credentials);

    this.bindEvents();
  }

  private bindEvents() {
    this.registerAvailableEvents([DataViewEvent.DATA_UPDATE, DataViewEvent.ERROR]);

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

  public addFilter(filterId: string, filter: Filter) {
    super.addFilter(filterId, filter as ColumnFilters);
    this._remoteSource.addFilter(filterId, { [this.column]: filter });
  }

  public removeFilter(filterId: string) {
    super.removeFilter(filterId);
    this._remoteSource.removeFilter(filterId);
  }

  public setFilters(filters: ColumnFilters) {
    this.dataOrigin.setFilters(filters);
  }

  public setSpatialFilter(spatialFilter: SpatialFilters) {
    if (spatialFilter === 'viewport') {
      this.createViewportSpatialFilter(uuidv4());
    }
  }

  private createViewportSpatialFilter(filterId: string) {
    if (this.dataOrigin instanceof Source) {
      throw new CartoDataViewError(
        `To filter by viewport a Layer is needed but a Source was provided`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }

    this.dataOrigin.on(TILES_LOADED_EVENT, () => {
      const deckInstance = (this.dataOrigin as Layer).getMapInstance();
      const viewport = deckInstance.getViewports(undefined)[0];

      if (viewport) {
        const nw = viewport.unproject([0, 0]);
        const se = viewport.unproject([viewport.width, viewport.height]);

        const bbox = [nw[0], se[1], se[0], nw[1]];
        this.filtersCollection.removeFilter(filterId);
        this.filtersCollection.addFilter(filterId, { bbox });
        this.emit(DataViewEvent.DATA_UPDATE);
      }
    });
  }

  public updateDataViewSource(options: GetDataOptions) {
    const sql = this._remoteSource.getSQLWithFilters(options.excludedFilters);
    this.dataviewsApi.setSource(sql);
  }
}

function getRemoteSource(dataOrigin: Layer | Source) {
  if (dataOrigin instanceof Source) {
    // TODO what about the other sources? Check DOSource and its instantiation process
    return dataOrigin as SQLSource | DatasetSource;
  }

  const layer = dataOrigin as Layer;
  return layer.source as SQLSource | DatasetSource;
}
