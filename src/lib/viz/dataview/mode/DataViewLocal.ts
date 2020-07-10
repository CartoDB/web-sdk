import { Layer, GeoJSONSource } from '@/viz';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { groupValuesByColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { DataViewMode } from './DataViewMode';

export class DataViewLocal extends DataViewMode {
  private useViewport = true;

  constructor(dataSource: Layer, column: string, useViewport = true) {
    super(dataSource, column);

    this.useViewport = useViewport;
    this.bindEvents();
  }

  public getSourceData(columns: string[] = [], options: { excludedFilters?: string[] } = {}) {
    if (!columns.includes(this.column)) {
      columns.push(this.column);
    }

    const { excludedFilters = [] } = options;

    if (this.useViewport) {
      return (this.dataSource as Layer).getViewportFeatures(excludedFilters);
    }

    // is GeoJSON Layer
    if (this.dataSource instanceof Layer) {
      return (this.dataSource.source as GeoJSONSource).getFeatures(excludedFilters);
    }

    // is GeoJSON Source
    return (this.dataSource as GeoJSONSource).getFeatures(excludedFilters);
  }

  public async groupBy(
    operationColumn: string,
    operation: AggregationType,
    options: { excludedFilters: string[] }
  ) {
    const sourceData = await this.getSourceData([operationColumn || this.column], options);
    const { groups, nullCount } = groupValuesByColumn(
      sourceData,
      operationColumn || this.column,
      this.column
    );
    const categories = Object.keys(groups)
      .map(group => createCategory(group, groups[group] as number[], operation))
      .sort(categoryOrder());

    return { nullCount, categories };
  }

  private bindEvents() {
    this.registerAvailableEvents(['dataUpdate', 'error']);

    this.dataSource.on('viewportLoad', () => {
      this.onDataUpdate();
    });

    this.dataSource.on('filterChange', () => {
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
