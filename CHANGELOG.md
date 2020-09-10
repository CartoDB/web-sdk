# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

**DEPRECATION WARNING**
This project won't be continued. Due to feedback received from the users and to bring a better integration with deck.gl, we're moving to a native deck.gl module (see https://github.com/CartoDB/deck.gl/blob/carto-module/docs/api-reference/carto/overview.md)
gi

## [Unreleased]

### Fixed

- Added setFilter remoteSource call to DataViewRemote setFilters method ([#142](https://github.com/CartoDB/web-sdk/pull/142/))

## [1.0.0-alpha.3] 2020-09-02

### Added

- Add new `carto.viz.Legend` widget for layers, working for these styles: basic, colorBins, colorCategories, colorContinuous, sizeBins, sizeCategories and sizeContinuous (#100, #102, #104, #105, #106, #107, #109 and #113)
- New `viewport` mode for style classifiers: quantiles, equal and stdev ([#119](https://github.com/CartoDB/web-sdk/pull/119/))
- Dynamic legends when using viewport styles ([#120](https://github.com/CartoDB/web-sdk/pull/120/))
- New `getId` method in `carto.viz.Layer` ([#113](https://github.com/CartoDB/web-sdk/pull/113/))
- New `BQSource` for public datasets ([#122](https://github.com/CartoDB/web-sdk/pull/122/))
- New `onLoad` option to `carto.viz.createMap` ([#121](https://github.com/CartoDB/web-sdk/pull/121/))
- Better performance in Layer, with a debounced approach to DATA_CHANGED event ([#130](https://github.com/CartoDB/web-sdk/pull/130))
- Better performance in `carto.viz.layer.getViewportFeatures`, with a ViewportFeaturesGenerator using with a queue system ([#131](https://github.com/CartoDB/web-sdk/pull/131))
- Better performance in `carto.viz.dataview.Histogram` with optimized calculations ([#133](https://github.com/CartoDB/web-sdk/pull/133))
- Add new optional `autoWidth` option to `Popup`, to adjust to its content ([#80](https://github.com/CartoDB/web-sdk/pull/80/))
- Add new methods to `carto.viz.Layer` to control its visibility: show / hide / isVisible ([#134](https://github.com/CartoDB/web-sdk/pull/134/))

### Changed

- Rename several public members in `carto.viz.Layer`: methods `replaceDeckGLLayer`, `getDeckGLLayer`, `getMapInstance` and property `source` to `replaceDeckLayer`, `getDeckLayer`, `getMap` and `getSource` ([#124](https://github.com/CartoDB/web-sdk/pull/124/))

### Fixed

- Fix WEBSDK VERSION for .cjs & .esm module distributions ([#115](https://github.com/CartoDB/web-sdk/pull/115/))
- Fix error on viewport mode in classifiers, with first render without proper styles ([#124](https://github.com/CartoDB/web-sdk/pull/124/))
- Fix `remove` error in `carto.viz.Layer`, keeping the reference to the old map ([#124](https://github.com/CartoDB/web-sdk/pull/124/))
- Fix esm bundle, where typescript interfaces were not correctly ignored by babel ([#126](https://github.com/CartoDB/web-sdk/pull/126/))
- Fix interactivity styles for common geojson files, expecting cartodb_id to be always present on `carto.viz.source.GeoJSON` ([#125](https://github.com/CartoDB/web-sdk/pull/125/))
- Fix some `carto.viz.dataview` errors (with remote mode), due to map instance not ready yet ([#136](https://github.com/CartoDB/web-sdk/pull/136/))
- Fix multiple calls to remote dataviews API (precise mode) every time the map is dragged ([#138](https://github.com/CartoDB/web-sdk/pull/138/))
- Fix `carto.viz.dataview.Formula` not getting an updated source ([#139](https://github.com/CartoDB/web-sdk/pull/139/))

## [1.0.0-alpha.2] 2020-07-31

### Added

- Aggregated data filtering in widgets ([#96](https://github.com/CartoDB/web-sdk/pull/96))
- Add interactivity styles to `carto.viz.style.icon` helper ([#110](https://github.com/CartoDB/web-sdk/pull/110/))

### Changed

- Rename `beforeLayerId | afterLayerId` options in `carto.viz.Layer.addTo` to a more clear `overLayerId | underLayerId`. ([#103](https://github.com/CartoDB/web-sdk/pull/103/))

### Fixed

- Fix `dataReady` event in `carto.viz.Layer` ([#99](https://github.com/CartoDB/web-sdk/pull/99/))
- Fix GeoJSON use on `carto.viz.dataview` and `dataUpdate` event with a `Source` instance ([#97](https://github.com/CartoDB/web-sdk/pull/97/))
- Fix `replaceDeckGLLayer` in `carto.viz.Layer` not considering latest layers state ([#108](https://github.com/CartoDB/web-sdk/pull/108/))
- Fix path for .cjs & .esm module distributions ([#112](https://github.com/CartoDB/web-sdk/pull/112/))

## [1.0.0-alpha.1] 2020-07-17

### Added

- New `carto.viz.style.icon` helper ([#53](https://github.com/CartoDB/web-sdk/pull/53/))
- Add `beforeLayerId` and `afterLayerId` options to `carto.viz.Layer.addTo` method, to customize layer position ([#67](https://github.com/CartoDB/web-sdk/pull/67))
- Widget synchronization when using remote dataviews ([#76](https://github.com/CartoDB/web-sdk/pull/76/))
- New data events in Layer: `dataReady` and `dataChanged` ([#84](https://github.com/CartoDB/web-sdk/pull/84))
- Improved aggregated calculations on dataviews
- A better documentation, with a new set of guides & examples
- New `isReady` method in `carto.viz.Layer` ([#101](https://github.com/CartoDB/web-sdk/pull/101))
- New option to specify the visual property to use in color (`color` | `strokeColor`) and size (`size` | `strokeWidth`) style helpers ([#98](https://github.com/CartoDB/web-sdk/pull/98))

### Changed

- Remove d3.format option from `carto.viz.Popup` ([#68](https://github.com/CartoDB/web-sdk/pull/68))
- New public API and defaults for the `carto.viz.dataview` namespace classes: `Formula`, `Category`, `Histogram` ([#72](https://github.com/CartoDB/web-sdk/pull/72))

### Fixed

- Fix remote widgets synchronization ([#63](https://github.com/CartoDB/web-sdk/pull/63))
- Fix popup interactivity glitch on hover ([#69](https://github.com/CartoDB/web-sdk/pull/69))
- Fix layer with empty data issue ([#78](https://github.com/CartoDB/web-sdk/pull/78))

## [1.0.0-alpha.0] 2020-07-06

- First release
