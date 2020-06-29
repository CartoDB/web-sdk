import { HistogramDataView } from '@/dataviews/histogram/Histogram';
import { HistogramDataViewResult, BinData } from '@/dataviews/mode/DataViewMode';
import { Widget } from '../widget';

export class Histogram extends Widget {
  private options: HistogramWidgetOptions = {};

  constructor(
    element: string | HTMLElement,
    dataView: HistogramDataView,
    options: HistogramWidgetOptions = {}
  ) {
    super(element, dataView);
    this.options = options;

    this.bindEvents();
    this.initializeWidget();
  }

  private async initializeWidget() {
    const histogramWidget = this.element as any;

    Object.keys(this.options).forEach(option => {
      histogramWidget[option] = this.options[option];
    });

    this.element.addEventListener('selectionChanged', (event: Event) => {
      const selectionData = (event as CustomEvent).detail;

      if (!selectionData) {
        this.dataView.removeFilter(this.widgetUUID);
        return;
      }

      this.dataView.addFilter(this.widgetUUID, { within: selectionData.selection });
    });

    await this.updateData();
  }

  protected async updateData() {
    const data = await this.dataView.getData();
    const histogramWidget = this.element as HTMLAsHistogramWidgetElement;
    histogramWidget.data = (data as HistogramDataViewResult).bins;
  }
}

interface HistogramWidgetOptions {
  valueFormatter?: (value: string | number) => string | number;
  [key: string]: unknown;
}

interface HTMLAsHistogramWidgetElement {
  data?: BinData[];
}
