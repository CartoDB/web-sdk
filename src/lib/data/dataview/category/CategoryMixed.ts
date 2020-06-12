import { CategoryOptions } from './CategoryBase';
import { Source } from '../Source';
import { CategorySource } from './CategorySource';
import { Viewport } from '../Viewport';

export class CategoryMixed extends CategorySource {
  protected events = ['dataChanged', 'optionChanged', 'error'];

  private viewport: Viewport;

  constructor(origin: Source, viewport: Viewport, options: CategoryOptions) {
    super(origin, options);

    this.viewport = viewport;

    this.registerAvailableEvents(this.events);
  }

  public async getData() {
    let aggregationResponse;

    try {
      aggregationResponse = await this.dataView.aggregation({
        aggregation: this.operation,
        operationColumn: this.operationColumn,
        limit: this.limit
      });
    } catch (error) {
      const { message } = error;
      this.emit('error', message);
      throw error;
    }

    const { aggregation, categories, count, max, min, nulls } = aggregationResponse;

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
}
