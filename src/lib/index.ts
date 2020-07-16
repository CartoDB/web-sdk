// Auth
import { Credentials, setDefaultCredentials } from './auth';

// Sources
import {
  // DOSource,
  GeoJSONSource,
  SQLSource,
  DatasetSource
} from './viz/source';

// Basemaps
import { createMap, createGoogleMap } from './viz/basemap';

// Basics
import { Layer } from './viz/layer';
import { Popup } from './viz/popups/Popup';

// Styles
import {
  basicStyle,
  colorBinsStyle,
  colorCategoriesStyle,
  colorContinuousStyle,
  sizeBinsStyle,
  sizeCategoriesStyle,
  sizeContinuousStyle,
  iconStyle
} from './viz/style';

// Dataviews
import { CategoryDataView, FormulaDataView, HistogramDataView } from './viz/dataview';

// Widgets
import { CategoryWidget, FormulaWidget, HistogramWidget } from './viz/widget';

/*
 * --- Public API ---
 */

// carto
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const version = WEBSDK_VERSION;

// carto.auth
export const auth = {
  Credentials,
  setDefaultCredentials
};

// carto.viz

// source
const source = {
  // DO: DOSource,
  GeoJSON: GeoJSONSource,
  SQL: SQLSource,
  Dataset: DatasetSource
};

const basemaps = { createMap, createGoogleMap };
const basics = { Layer, Popup };

// dataview
const dataview = {
  Category: CategoryDataView,
  Formula: FormulaDataView,
  Histogram: HistogramDataView
};

// widget
const widget = {
  Category: CategoryWidget,
  Formula: FormulaWidget,
  Histogram: HistogramWidget
};

// style
const style = {
  basic: basicStyle,
  colorBins: colorBinsStyle,
  colorCategories: colorCategoriesStyle,
  colorContinuous: colorContinuousStyle,
  sizeBins: sizeBinsStyle,
  sizeCategories: sizeCategoriesStyle,
  sizeContinuous: sizeContinuousStyle,
  icon: iconStyle
};

export const viz = {
  source,
  dataview,
  widget,
  style,
  ...basemaps,
  ...basics
};
