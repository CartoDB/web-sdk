import { FormulaDataView } from '@/viz/dataview';
import { FormulaDataViewData } from '@/viz/dataview/formula/FormulaDataViewImpl';
import { Widget } from '../widget';

export class FormulaWidget extends Widget<FormulaDataViewData> {
  private options: FormulaWidgetOptions = {};

  constructor(
    element: string | HTMLElement,
    dataView: FormulaDataView,
    options: FormulaWidgetOptions = {}
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
    const formulaWidget = this.element as any;

    Object.keys(this.options).forEach(option => {
      formulaWidget[option] = this.options[option];
    });

    await this.updateData();
  }

  protected async updateData() {
    const data = await this.dataView.getData({ excludedFilters: [this.widgetUUID] });
    const formulaWidget = this.element as HTMLAsFormulaWidgetElement;
    formulaWidget.value = data.result;
  }
}

interface FormulaWidgetOptions {
  valueFormatter?: (value: string | number) => string | number;
  [key: string]: unknown;
}

interface HTMLAsFormulaWidgetElement {
  value?: number;
}
