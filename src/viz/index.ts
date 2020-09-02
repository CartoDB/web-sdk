export { Popup } from './popups/Popup';
export { Layer } from './layer/Layer';
export { Source, GeoJSONSource, SQLSource, DatasetSource } from './source';

// Style helpers
export {
  basicStyle,
  colorBinsStyle,
  colorCategoriesStyle,
  colorContinuousStyle,
  sizeContinuousStyle,
  sizeBinsStyle,
  sizeCategoriesStyle,
  iconStyle
} from './style';

export type {
  BasicOptionsStyle,
  ColorBinsOptionsStyle,
  ColorCategoriesOptionsStyle,
  ColorContinuousOptionsStyle,
  SizeCategoriesOptionsStyle,
  SizeBinsOptionsStyle,
  IconOptionsStyle
} from './style';

// Basemap helpers
export { createGoogleMap, createMap } from './basemap';
