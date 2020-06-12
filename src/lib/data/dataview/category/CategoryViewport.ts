import { AggregationType, aggregate } from '../../operations/aggregation/aggregation';
import { groupValuesByAnotherColumn } from '../../operations/grouping';
import { CategoryBase, CategoryOptions, CategoryData } from './CategoryBase';
import { Viewport } from '../Viewport';

export class CategoryViewport extends CategoryBase<Viewport> {
  constructor(origin: Viewport, options: CategoryOptions) {
    const events = ['dataUpdate'];
    super(origin, options, events);
  }

  public async getData(): Promise<CategoryData> {
    const { categories, nullCount } = await this.groupBy();
    const categoryValues = categories.map(category => category.value);

    return {
      categories: Number.isInteger(this._limit as number)
        ? categories.splice(0, this._limit)
        : categories,
      count: categories.length,
      operation: this.operation,
      max: aggregate(categoryValues, AggregationType.MAX),
      min: aggregate(categoryValues, AggregationType.MIN),
      nullCount
    };
  }

  private async groupBy() {
    const sourceData = await this.dataView.getSourceData([this.operationColumn]);
    const { groups, nullCount } = groupValuesByAnotherColumn(
      sourceData,
      this.operationColumn,
      this.dataView.column
    );

    const categories = Object.keys(groups).map(group =>
      this.createCategory(group, groups[group] as number[])
    );

    return { nullCount, categories };
  }

  private createCategory(name: string, data: number[]) {
    const numberFilter = function numberFilter(value: number | undefined) {
      return Number.isFinite(value as number);
    };

    const filteredValues = data
      .map(number => castToNumberOrUndefined(number))
      .filter(numberFilter) as number[];

    return {
      name,
      value: aggregate(filteredValues, this.operation)
    };
  }
}

function castToNumberOrUndefined(number: string | number) {
  const castedNumber = Number(number);

  if (!Number.isFinite(castedNumber)) {
    return;
  }

  // eslint-disable-next-line consistent-return
  return castedNumber;
}
