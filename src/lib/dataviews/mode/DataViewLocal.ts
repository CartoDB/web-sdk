import { Layer } from '@/viz';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { groupValuesByAnotherColumn } from '@/data/operations/grouping';
import { castToNumberOrUndefined } from '@/core/utils/number';
import { DataViewModeBase, DataViewData } from './DataViewModeBase';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class DataViewLocal extends DataViewModeBase {
  constructor(dataSource: Layer, column: string) {
    super(dataSource, column);

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
    return (this.dataSource as Layer).getViewportFeatures([this.column, ...columns]);
  }

  private async groupBy(operationColumn: string, operation: AggregationType) {
    const sourceData = await this.getSourceData([operationColumn]);
    const { groups, nullCount } = groupValuesByAnotherColumn(
      sourceData,
      operationColumn,
      this.column
    );

    const categories = Object.keys(groups).map(group =>
      createCategory(group, groups[group] as number[], operation)
    );

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

function createCategory(name: string, data: number[], operation: AggregationType) {
  const numberFilter = function numberFilter(value: number | undefined) {
    return Number.isFinite(value as number);
  };

  const filteredValues = data
    .map(number => castToNumberOrUndefined(number))
    .filter(numberFilter) as number[];

  return {
    name,
    value: aggregate(filteredValues, operation)
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
