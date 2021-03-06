import { CategoryDataView } from '@/viz/dataview';
import { CategoryDataViewData } from '@/viz/dataview/category/CategoryDataViewImpl';
import { Widget } from '../widget';

export class CategoryWidget extends Widget<CategoryDataViewData> {
  private options: CategoryWidgetOptions = {};

  constructor(
    element: string | HTMLElement,
    dataView: CategoryDataView,
    options: CategoryWidgetOptions = {}
  ) {
    super(element, dataView);
    this.options = options;

    this.bindEvents();
    this.initializeWidget();
  }

  protected bindEvents() {
    super.bindEvents();
  }

  private async initializeWidget() {
    const categoryWidget = this.element as any;

    Object.keys(this.options).forEach(option => {
      categoryWidget[option] = this.options[option];
    });

    this.element.addEventListener('categoriesSelected', (event: Event) => {
      const categories = (event as CustomEvent).detail;

      if (!categories || !categories.length) {
        this.dataView.removeFilter(this.widgetUUID);
        return;
      }

      this.dataView.addFilter(this.widgetUUID, { in: categories });
    });

    await this.updateData();
  }

  protected async updateData() {
    const data = await this.dataView.getData({ excludedFilters: [this.widgetUUID] });
    const categoryWidget = this.element as HTMLAsCategoryWidgetElement;
    categoryWidget.categories = data.categories;
  }
}

interface CategoryWidgetOptions {
  valueFormatter?: (value: string | number) => string | number;
  [key: string]: unknown;
}

interface HTMLAsCategoryWidgetElement {
  categories?: CategoryData[];
}

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}
