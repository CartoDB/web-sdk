// Auth
import { Credentials, setDefaultCredentials } from './core/Credentials';

// Sources
import { DOSource, CARTOSource, GeoJsonSource } from './viz/sources';

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
  sizeContinuousStyle
} from './viz/style';

// Dataviews
import { Category, Formula, HistogramDataView } from './dataviews';

// Widgets
import { Category as CategoryWidget, Formula as FormulaWidget, HistogramWidget } from './widgets';

/*
 * --- Public API ---
 */

// carto
// const auth = [ Credentials, setDefaultCredentials ];
export { Credentials, setDefaultCredentials };

// carto.viz
const sources = { DOSource, CARTOSource, GeoJsonSource };
const basemaps = { createMap, createGoogleMap };
const basics = { Layer, Popup };
const styles = {
  basicStyle,
  colorBinsStyle,
  colorCategoriesStyle,
  colorContinuousStyle,
  sizeBinsStyle,
  sizeCategoriesStyle,
  sizeContinuousStyle
};

export const viz = {
  ...sources,
  ...basemaps,
  ...styles,
  ...basics
};

// carto.dataview
export const dataview = {
  Category,
  Formula,
  Histogram: HistogramDataView
};

// carto.widget
export const widget = {
  Category: CategoryWidget,
  Formula: FormulaWidget,
  Histogram: HistogramWidget
};
