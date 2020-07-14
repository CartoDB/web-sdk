export { Popup } from './popups/Popup';
export { Layer } from './layer/Layer';
export { Source, GeoJSONSource, SQLSource, DatasetSource } from './source';

// Style helpers
export {
  basicStyle,
  BasicOptionsStyle,
  colorBinsStyle,
  ColorBinsOptionsStyle,
  colorCategoriesStyle,
  ColorCategoriesOptionsStyle,
  colorContinuousStyle,
  ColorContinuousOptionsStyle,
  sizeBinsStyle,
  SizeBinsOptionsStyle,
  sizeCategoriesStyle,
  SizeCategoriesOptionsStyle,
  sizeContinuousStyle,
  iconStyle,
  IconOptionsStyle
} from './style';

// Basemap helpers
export { createGoogleMap, createMap } from './basemap';
