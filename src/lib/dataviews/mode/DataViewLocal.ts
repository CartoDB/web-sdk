import { Layer } from '@/viz';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { groupValuesByColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { GeoJsonSource } from '@/viz/sources';
import { DataViewMode, DataViewData } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { CategoryElement } from '../category/CategoryImpl';

export class DataViewLocal extends DataViewMode {
  private useViewport = true;

  constructor(dataSource: Layer, column: string, useViewport = true) {
    super(dataSource, column);

    this.useViewport = useViewport;
    this.bindEvents();
  }

  public async aggregation(aggregationParams: {
    aggregation: AggregationType;
    operationColumn: string;
    limit?: number;
  }): Promise<Partial<DataViewData>> {
    const { aggregation, operationColumn, limit } = aggregationParams;
    const { categories, nullCount } = await this.groupBy(operationColumn, aggregation);
    const categoryValues = categories.map(category => category.value);

    return {
      categories: Number.isInteger(limit as number) ? categories.splice(0, limit) : categories,
      count: categories.length,
      operation: aggregation,
      max: aggregate(categoryValues, AggregationType.MAX),
      min: aggregate(categoryValues, AggregationType.MIN),
      nullCount
    };
  }

  public async formula(operation: AggregationType): Promise<Partial<DataViewData>> {
    const features = await this.getSourceData();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = features.map((feature: { [x: string]: any }) => feature[this.column]);
    validateNumbersOrNullIn(values);

    // just include numbers in calculations... TODO: should we consider features with null & undefined for the column?
    const filteredValues = values.filter(Number.isFinite);

    return {
      result: aggregate(filteredValues, operation),
      operation,
      nullCount: values.length - filteredValues.length
    };
  }

  private getSourceData(columns: string[] = []) {
    if (!columns.includes(this.column)) {
      columns.push(this.column);
    }

    if (this.useViewport) {
      return (this.dataSource as Layer).getViewportFeatures(columns);
    }

    return ((this.dataSource as Layer).source as GeoJsonSource).getFeatures(columns);
  }

  private async groupBy(operationColumn: string, operation: AggregationType) {
    const sourceData = await this.getSourceData([operationColumn || this.column]);
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

    if (this.dataSource instanceof Layer) {
      this.dataSource.on('viewportLoad', () => {
        this.onDataUpdate();
      });
    }
  }

  private onDataUpdate() {
    this.emit('dataUpdate');
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

/**
 * Check the values are numbers or null | undefined, taking a small sample
 * @param features
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateNumbersOrNullIn(values: any[]) {
  const sample = values.slice(0, Math.min(values.length, 10));
  sample.forEach(value => {
    const isAcceptedNull = value === null || value === undefined; // TODO should we just support null?

    if (!isAcceptedNull && typeof value !== 'number') {
      throw new CartoDataViewError(
        `Column property for Formula can just contain numbers (or nulls) and a ${typeof value} with ${value} value was found. Please check documentation.`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }
  });
}
