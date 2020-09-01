import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { LayerEvent } from '@/viz/layer/Layer';
import { Filter, SpatialFilters, ColumnFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { uuidv4 } from '@/core/utils/uuid';
import { SourceEvent } from '@/viz/source/Source';
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

    this._remoteSource.on(SourceEvent.FILTER_CHANGE, () => {
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

    this.dataOrigin.on(LayerEvent.DATA_CHANGED, () => {
      const deckInstance = (this.dataOrigin as Layer).getMap();

      if (deckInstance === undefined) {
        throw new CartoDataViewError("Layer doesn't have a map innstance");
      }

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
    checkAllowedSourceOrThrow(dataOrigin);
    return dataOrigin as SQLSource | DatasetSource;
  }

  const layer = dataOrigin as Layer;
  const source = layer.getSource();
  checkAllowedSourceOrThrow(source);

  return source as SQLSource | DatasetSource;
}

function checkAllowedSourceOrThrow(source: Source) {
  if (source.sourceType !== 'SQL' && source.sourceType !== 'Dataset') {
    throw new CartoDataViewError(
      `Just SQL or Dataset source type is allowed for DataViewRemote, based on dataviews endpoint`,
      dataViewErrorTypes.DEFAULT
    );
  }
}
