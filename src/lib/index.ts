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
import { CategoryDataView, FormulaDataView, CategorySourceDataView } from './data/dataview';

// Widgets
import { Category, Formula } from './widgets';

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

// carto.data
const dataviews = { CategoryDataView, FormulaDataView, CategorySourceDataView };

export const data = {
  ...dataviews
};

// carto.widgets
export const widgets = {
  Category,
  Formula
};
