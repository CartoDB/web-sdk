# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

## [Unreleased]

### Added

- Add new `Legend` widget for layers, working for these styles: basic, colorBins, colorCategories, colorContinuous, sizeBins, sizeCategories and sizeContinuous (#100, #102, #104, #105, #106, #107, #109 and #113)
- New `getId` method in `carto.viz.Layer` ([#113](https://github.com/CartoDB/web-sdk/pull/113/))

### Fixed

- Fix WEBSDK VERSION for .cjs & .esm module distributions ([#115](https://github.com/CartoDB/web-sdk/pull/115/))

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
