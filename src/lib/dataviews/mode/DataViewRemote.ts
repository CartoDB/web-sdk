import { MapsDataviews as DataviewsApi } from '@/maps/MapsDataviews';
import { AggregationType } from '@/maps/Client';
import { defaultCredentials } from '@/core/Credentials';
import { Source, CARTOSource, Layer } from '@/viz';
import { Filter, spatialFilter, SpatialFilters } from '@/viz/filters/types';
import { FiltersCollection } from '@/viz/filters/FiltersCollection';
import { RemoteFilterApplicator } from '@/viz/filters/RemoteFilterApplicator';
import { DataViewModeBase } from './DataViewModeBase';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewRemote extends DataViewModeBase {
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
      limit,
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

  public addFilter(filterId: string, filter: Filter | spatialFilter) {
    if (filter === spatialFilter.VIEWPORT) {
      this.createViewportSpatialFilter(filterId);
    } else {
      this.dataSource.addFilter(filterId, { [this.column]: filter });
    }
  }

  private createViewportSpatialFilter(filterId: string) {
    // const deckInstance = (this.dataSource as Layer).getMapInstance();
    // const { onViewStateChange } = deckInstance.props;

    // deckInstance.setProps({
    //   onViewStateChange: (...args: any) => {
    //     const { viewState, interactionState } = args[0];
    //     const { inTransition, isDragging, isPanning, isRotating, isZooming } = interactionState;

    //     // if (!inTransition && !isDragging && !isPanning && !isRotating && !isZooming) {
    //     if (!isDragging && !isRotating) {
    //       const viewport = new WebMercatorViewport(viewState);

    //       const nw = viewport.unproject([0, 0]);
    //       const se = viewport.unproject([viewport.width, viewport.height]);

    //       const bbox = [nw[0], se[1], se[0], nw[1]];
    //       this.filtersCollection.removeFilter(filterId);
    //       this.filtersCollection.addFilter(filterId, { within: bbox });
    //       this.emit('dataUpdate');
    //     }

    //     if (onViewStateChange) {
    //       onViewStateChange(args);
    //     }
    //   }
    // });
    (this.dataSource as Layer).on('viewportLoad', () => {
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
    source = dataSource as CARTOSource;
  } else {
    const layer = dataSource as Layer;
    source = layer.source as CARTOSource;
  }

  return source.value;
}
