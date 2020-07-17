import { Layer } from '@/viz';
import { DATA_CHANGED_EVENT } from '@/viz/layer/Layer';
import { AggregationType, aggregateValues } from '@/data/operations/aggregation';
import { groupValuesByColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { ColumnFilters, SpatialFilters } from '@/viz/filters/types';
import { DataViewMode } from './DataViewMode';
import { GetDataOptions } from '../DataViewImpl';

export class DataViewLocal extends DataViewMode {
  private useViewport = false;

  constructor(dataOrigin: Layer, column: string) {
    super(dataOrigin, column);
    this.bindEvents();
  }

  public async getSourceData(options: GetDataOptions = {}) {
    const { excludedFilters = [], aggregationOptions } = options;

    if (this.useViewport) {
      await (this.dataOrigin as Layer).addAggregationOptions(
        aggregationOptions?.numeric,
        aggregationOptions?.dimension
      );
    }

    // is GeoJSON Layer
    if (this.dataOrigin instanceof Layer) {
      await this.dataOrigin.addSourceField(this.column);
    } else {
      this.dataOrigin.addField(this.column);
    }

    return this.useViewport
      ? (this.dataOrigin as Layer).getViewportFeatures(excludedFilters)
      : this.dataOrigin.getFeatures(excludedFilters);
  }

  public async groupBy(
    operationColumn: string,
    operation: AggregationType,
    options: GetDataOptions
  ) {
    const columnName = operationColumn || this.column;
    const aggregatedColumnName = `_cdb_${operation}__${columnName}`;

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

  public setSpatialFilter(spatialFilter: SpatialFilters) {
    this.useViewport = spatialFilter === 'viewport';
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate', 'error']);

    this.dataOrigin.on(DATA_CHANGED_EVENT, () => {
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
    value: aggregateValues(categoryValues, operation).result
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
