import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { Filter, SpatialFilters, BuiltInFilters, ColumnFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { DataViewMode, DataViewCalculation, HistogramDataViewData } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewMode {
  protected dataviewsApi: DataviewsApi;
  protected sqlSource: SQLSource | DatasetSource;

  private filtersCollection = new FiltersCollection<SpatialFilters, RemoteFilterApplicator>(
    RemoteFilterApplicator
  );

  constructor(dataSource: Layer | Source, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    const dataset = getSource(dataSource);
    this.sqlSource = dataset;
    this.dataviewsApi = new DataviewsApi(dataset.value, credentials);

    this.bindEvents();
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate', 'error']);

    this.sqlSource.on('filterChange', () => {
      this.onDataUpdate();
    });
  }

  public async aggregation(
    aggregationParams: {
      aggregation: AggregationType;
      operationColumn: string;
      limit?: number;
    },
    options: { filterId?: string }
  ) {
    // Spatial Filters
    const applicator = this.filtersCollection.getApplicatorInstance();
    const bbox = (applicator as RemoteFilterApplicator).getBbox();

    this.updateDataViewSource(options);

    const { aggregation, limit, operationColumn } = aggregationParams;

    const aggregationResponse = await this.dataviewsApi.aggregation({
      column: this.column,
      aggregation,
      aggregationColumn: operationColumn,
      categories: limit,
      bbox
    });

    if (
      aggregationResponse.errors_with_context &&
      aggregationResponse.errors_with_context.length > 0
    ) {
      const { message, type } = aggregationResponse.errors_with_context[0];
      throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
    }

    const { categories, count, max, min, nulls } = aggregationResponse;

    const adaptedCategories = categories.map(({ category, value }) => {
      return {
        name: category,
        value
      };
    });

    return {
      categories: adaptedCategories,
      count,
      max,
      min,
      nullCount: nulls,
      operation: aggregation
    };
  }

  public async formula(operation: AggregationType) {
    const applicator = this.filtersCollection.getApplicatorInstance();
    const bbox = (applicator as RemoteFilterApplicator).getBbox();

    this.dataviewsApi.setSource(this.sqlSource.getSQLWithFilters());

    const formulaResponse = await this.dataviewsApi.formula({
      column: this.column,
      operation,
      bbox
    });

    if (formulaResponse.errors_with_context && formulaResponse.errors_with_context.length > 0) {
      const { message, type } = formulaResponse.errors_with_context[0];
      throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
    }

    const { result, nulls } = formulaResponse;

    return {
      result,
      operation,
      nullCount: nulls
    };
  }

  public async histogram(
    binsNumber: number,
    start: number,
    end: number,
    options: { filterId?: string }
  ): Promise<HistogramDataViewData> {
    const applicator = this.filtersCollection.getApplicatorInstance();
    const bbox = (applicator as RemoteFilterApplicator).getBbox();

    // Column Filters
    this.updateDataViewSource(options);

    const aggregationResponse = await this.dataviewsApi.histogram({
      bins: binsNumber,
      start,
      end,
      bbox,
      column: this.column
    });

    if (
      aggregationResponse.errors_with_context &&
      aggregationResponse.errors_with_context.length > 0
    ) {
      const { message, type } = aggregationResponse.errors_with_context[0];
      throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
    }

    const transformedBins = aggregationResponse.bins.map(
      (binContainer: Record<string, number>) => ({
        min: binContainer.min,
        max: binContainer.max,
        avg: binContainer.avg,
        bin: binContainer.bin,
        value: binContainer.freq,
        normalized: binContainer.freq / aggregationResponse.totalAmount,
        start: aggregationResponse.bins_start + binContainer.bin * aggregationResponse.bin_width,
        end:
          aggregationResponse.bins_start +
          binContainer.bin * aggregationResponse.bin_width +
          aggregationResponse.bin_width
      })
    );

    return {
      bins: transformedBins,
      nulls: aggregationResponse.nulls,
      totalAmount: aggregationResponse.totalAmount
    };
  }

  public addFilter(filterId: string, filter: Filter | BuiltInFilters | ColumnFilters) {
    if (filter === BuiltInFilters.VIEWPORT) {
      this.createViewportSpatialFilter(filterId);
      return;
    }

    super.addFilter(filterId, filter as ColumnFilters);
    this.sqlSource.addFilter(filterId, { [this.column]: filter });
  }

  public removeFilter(filterId: string) {
    super.removeFilter(filterId);
    this.sqlSource.removeFilter(filterId);
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

  public updateDataViewSource(options: { filterId?: string }) {
    const filterOptions = options.filterId ? [options.filterId] : [];

    const sql = this.sqlSource.getSQLWithFilters(filterOptions);
    this.dataviewsApi.setSource(sql);
  }
}

function getSource(dataSource: Layer | Source) {
  if (dataSource instanceof Source) {
    // TODO what about the other sources?
    return dataSource as SQLSource | DatasetSource;
  }

  const layer = dataSource as Layer;
  return layer.source as SQLSource | DatasetSource;
}
