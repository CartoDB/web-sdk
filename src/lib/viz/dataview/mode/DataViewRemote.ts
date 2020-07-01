import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { defaultCredentials } from '@/auth';
import { Layer, Source, SQLSource, DatasetSource } from '@/viz';
import { Filter, SpatialFilters, BuiltInFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { AggregationType } from '@/data/operations/aggregation/aggregation';
import { DataViewMode, DataViewCalculation, HistogramDataViewData } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewMode {
  protected dataviewsApi: DataviewsApi;

  private filtersCollection = new FiltersCollection<SpatialFilters, RemoteFilterApplicator>(
    RemoteFilterApplicator
  );

  constructor(dataSource: Layer | Source, column: string, credentials = defaultCredentials) {
    super(dataSource, column);

    const dataset = getDatasetName(dataSource);
    this.dataviewsApi = new DataviewsApi(dataset, credentials);

    this.registerAvailableEvents(['dataUpdate', 'error']);
  }

  public async aggregation(aggregationParams: {
    aggregation: AggregationType;
    operationColumn: string;
    limit?: number;
  }) {
    const applicator = this.filtersCollection.getApplicatorInstance();
    const bbox = (applicator as RemoteFilterApplicator).getBbox();
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
    start = 0,
    end = 1000
  ): Promise<HistogramDataViewData> {
    const applicator = this.filtersCollection.getApplicatorInstance();
    const bbox = (applicator as RemoteFilterApplicator).getBbox();

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