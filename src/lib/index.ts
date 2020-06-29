// Auth
import { Credentials, setDefaultCredentials } from './auth';

// Sources
import {
  // DOSource,
  GeoJSONSource,
  SQLSource,
  DatasetSource
} from './source';

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
import { Category, Formula } from './dataviews';

// Widgets
import { Category as CategoryWidget, Formula as FormulaWidget } from './widgets';

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

// carto.source
export const source = {
  // DO: DOSource,
  GeoJSON: GeoJSONSource,
  SQL: SQLSource,
  Dataset: DatasetSource
};

// carto.viz
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
  ...basemaps,
  ...styles,
  ...basics
};

// carto.dataview
export const dataview = {
  Category,
  Formula
};

// carto.widget
export const widget = {
  Category: CategoryWidget,
  Formula: FormulaWidget
};
