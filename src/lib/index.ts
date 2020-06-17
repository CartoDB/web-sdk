// Auth
import { Credentials, setDefaultCredentials } from './core/Credentials';

// Sources
import { DOSource, CARTOSource, GeoJsonSource } from './viz/sources';

// Basemaps
import { createMap, createGoogleMap } from './viz/basemap';

// Widgets
import { Category as CategoryWidget } from './widget';

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
import { Category, Formula } from './dataview';

/*
 * --- Public API ---
 */

// carto
// const auth = [ Credentials, setDefaultCredentials ];
export { Credentials, setDefaultCredentials };

// carto.viz
const sources = { DOSource, CARTOSource, GeoJsonSource };
const basemaps = { createMap, createGoogleMap };
const widgets = { CategoryWidget };
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
  ...widgets,
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
  CategoryWidget
};
