import { Layer, GeoJSONSource } from '@/viz';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { groupValuesByColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { ColumnFilters, SpatialFilters } from '@/viz/filters/types';
import { DataViewMode } from './DataViewMode';
import { GetDataOptions } from '../DataViewImpl';

export class DataViewLocal extends DataViewMode {
  private useViewport = true;

  constructor(dataOrigin: Layer, column: string, useViewport = true) {
    super(dataOrigin, column);

    this.useViewport = useViewport;
    this.bindEvents();
  }

  public async getSourceData(options: GetDataOptions = {}) {
    const { excludedFilters = [], aggregationOptions } = options;

    if (this.useViewport) {
      await (this.dataOrigin as Layer).addAggregationOptions(
        aggregationOptions?.numeric,
        aggregationOptions?.dimension
      );

      return (this.dataOrigin as Layer).getViewportFeatures(excludedFilters);
    }

    // is GeoJSON Layer
    if (this.dataOrigin instanceof Layer) {
      return (this.dataOrigin.source as GeoJSONSource).getFeatures(excludedFilters);
    }

    // is GeoJSON Source
    return (this.dataOrigin as GeoJSONSource).getFeatures(excludedFilters);
  }

  public async groupBy(
    operationColumn: string,
    operation: AggregationType,
    options: GetDataOptions
  ) {
    const columnName = operationColumn || this.column;
    const aggregatedColumnName = `${operation}__${columnName}`;

    const sourceData = await this.getSourceData(options);
    const adaptedFeatures = sourceData.map((feature: Record<string, unknown>) => {
      return {
        ...feature,
        [columnName]: feature[aggregatedColumnName]
          ? feature[aggregatedColumnName]
          : feature[columnName]
      };
    });

    const { groups, nullCount } = groupValuesByColumn(adaptedFeatures, columnName, this.column);
    const categories = Object.keys(groups)
      .map(group => createCategory(group, groups[group] as number[], operation))
      .sort(categoryOrder());

    return { nullCount, categories };
  }

  public setFilters(filters: ColumnFilters) {
    if (this.dataOrigin instanceof Layer) {
      this.dataOrigin.setFilters(filters);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  public setSpatialFilter(_spatialFilter: SpatialFilters) {
    return undefined;
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate', 'error']);

    this.dataOrigin.on('viewportLoad', () => {
      this.onDataUpdate();
    });

    this.dataOrigin.on('filterChange', () => {
      this.onDataUpdate();
    });
  }
}

function createCategory(name: string, data: number[], operation: AggregationType): CategoryElement {
  let categoryValues = data;
  const shouldFilterValues = operation !== AggregationType.COUNT;

  if (shouldFilterValues) {
    const numberFilter = function numberFilter(value: number | undefined) {
      return Number.isFinite(value as number);
    };

    categoryValues = (data as number[])
      .map(number => castToNumberOrUndefined(number))
      .filter(numberFilter) as number[];
  }

  return {
    name,
    value: aggregate(categoryValues, operation)
  };
}

/**
 * Function to sort categories. In case two categories
 * have the same value then is sorted alphabetically
 *
 * @param desc - flag to indicate the order direction:
 * true for descending order (by default)
 * false for ascending order
 */
function categoryOrder(desc = true) {
  return (categoryA: CategoryElement, categoryB: CategoryElement) => {
    let order;

    if (desc) {
      order = categoryB.value - categoryA.value;
    } else {
      order = categoryA.value - categoryB.value;
    }

    if (order === 0) {
      order = categoryA.name >= categoryB.name ? 1 : -1;
    }

    return order;
  };
}

export interface CategoryElement {
  name: string;
  value: number;
}
