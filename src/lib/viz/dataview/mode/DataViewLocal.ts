import { Layer, GeoJSONSource } from '@/viz';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { groupValuesByColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { DataViewMode, DataViewData, HistogramDataViewData } from './DataViewMode';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { CategoryElement } from '../category/CategoryDataViewImpl';

export class DataViewLocal extends DataViewMode {
  private useViewport = true;

  constructor(dataSource: Layer, column: string, useViewport = true) {
    super(dataSource, column);

    this.useViewport = useViewport;
    this.bindEvents();
  }

  public async aggregation(
    aggregationParams: {
      aggregation: AggregationType;
      operationColumn: string;
      limit?: number;
    },
    options: { filterId?: string }
  ): Promise<Partial<DataViewData>> {
    const { aggregation, operationColumn, limit } = aggregationParams;
    const { categories, nullCount } = await this.groupBy(operationColumn, aggregation, options);
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

  public async histogram(
    binsNumber: number,
    start: number | undefined,
    end: number | undefined,
    options: { filterId: string }
  ): Promise<HistogramDataViewData> {
    const features = (await this.getSourceData([this.column], options)) as Record<string, number>[];
    const sortedFeatures = features.map(feature => feature[this.column]).sort((a, b) => a - b);

    const startValue = start ?? Math.min(...sortedFeatures);
    const endValue = end ?? Math.max(...sortedFeatures);
    let nulls = 0;

    const binsDistance = (endValue - startValue) / binsNumber;
    const bins = Array(binsNumber)
      .fill(binsNumber)
      .map((_, currentIndex) => ({
        bin: currentIndex,
        start: startValue + currentIndex * binsDistance,
        end: startValue + currentIndex * binsDistance + binsDistance,
        value: 0,
        values: [] as number[]
      }));

    sortedFeatures.forEach(feature => {
      const featureValue = feature;

      if (!featureValue) {
        nulls += 1;
        return;
      }

      const binContainer = bins.find(bin => bin.start <= featureValue && bin.end > featureValue);

      if (!binContainer) {
        return;
      }

      binContainer.value += 1;
      binContainer.values.push(featureValue);
    });

    const transformedBins = bins.map(binContainer => {
      return {
        bin: binContainer.bin,
        start: binContainer.start,
        end: binContainer.end,
        value: binContainer.value,
        min: aggregate(binContainer.values, AggregationType.MIN),
        max: aggregate(binContainer.values, AggregationType.MAX),
        avg: aggregate(binContainer.values, AggregationType.AVG),
        normalized: binContainer.values.length / features.length
      };
    });

    return {
      bins: transformedBins,
      nulls,
      totalAmount: features.length
    };
  }

  private getSourceData(columns: string[] = [], options: { filterId?: string } = {}) {
    if (!columns.includes(this.column)) {
      columns.push(this.column);
    }

    if (this.useViewport) {
      const filterOptions = options.filterId ? [options.filterId] : [];
      return (this.dataSource as Layer).getViewportFilteredFeatures(filterOptions);
    }

    // is GeoJSON Layer
    if (this.dataSource instanceof Layer) {
      return (this.dataSource.source as GeoJSONSource).getFeatures(columns);
    }

    // is GeoJSON Source
    return (this.dataSource as GeoJSONSource).getFeatures(columns);
  }

  private async groupBy(
    operationColumn: string,
    operation: AggregationType,
    options: { filterId?: string }
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
