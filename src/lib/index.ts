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
  sizeContinuousStyle
} from './viz/style';

// Dataviews
import { CategoryDataView, FormulaDataView } from './dataview';

// Widgets
import { CategoryWidget, FormulaWidget } from './widget';

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
  source,
  ...basemaps,
  ...styles,
  ...basics
};

// carto.dataview
export const dataview = {
  Category: CategoryDataView,
  Formula: FormulaDataView
};

// carto.widget
export const widget = {
  Category: CategoryWidget,
  Formula: FormulaWidget
};
