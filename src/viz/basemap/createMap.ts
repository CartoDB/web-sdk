import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { CartoMapStyle } from './CartoMapStyle';
import { getMapContainer } from '../utils/map-utils';
import { CartoBaseMapError } from '../errors/basemap-error';

interface DeckViewState {
  bearing: number;
  latitude: number;
  longitude: number;
  pitch: number;
  zoom: number;
}

interface IWithViewState {
  viewState: DeckViewState;
}

export interface DeckGLMapOptions {
  basemap: string;
  view: DeckViewState;
  container: HTMLElement | string;
}

const CANVAS_STYLE = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%'
};

function createCanvas(container: HTMLElement | string) {
  const c = typeof container === 'string' ? document.getElementById(container) : container;

  if (!c) {
    throw new CartoBaseMapError('Container not found');
  }

  // Add DOM elements
  const containerStyle = window.getComputedStyle(c);

  if (containerStyle.position === 'static') {
    c.style.position = 'relative';
  }

  const mapCanvas = document.createElement('div');
  c.appendChild(mapCanvas);
  Object.assign(mapCanvas.style, CANVAS_STYLE);

  const deckCanvas = document.createElement('canvas');
  c.appendChild(deckCanvas);
  Object.assign(deckCanvas.style, CANVAS_STYLE);

  return { c, mapCanvas, deckCanvas };
}

/**
 * A helper function to create a CARTO basemap on a 'map' DOM element, rendered using *Mapbox GL JS*
 *
 *
 * Examples:
 * ```javascript
 *    // Several options to create the map are allowed
 *    const deckMap = carto.viz.createMap();
 *    const deckMap = carto.viz.createMap({ basemap: 'voyager'});
 *    const deckMap = carto.viz.createMap({ basemap: 'voyager', view: { zoom: 4 } });
 *    const deckMap = carto.viz.createMap({ basemap: 'positron', view: { zoom: 4, longitude: 3, latitude: 40, pitch: 45, bearing: 30 }, container: 'map' });
 * ```
 *
 * This method creates a stateless map, which later on can be easily updated externally, with code like
 * ```javascript
 *    deckMap.setProps({ viewState: { newLongitude, newLatitude, newZoom } });
 * ```
 *
 * @export
 * @param {DeckGLMapOptions} mapOptions
 * @returns
 */
export function createMap(options?: Partial<DeckGLMapOptions>) {
  const chosenOptions: DeckGLMapOptions = {
    basemap: 'positron',
    view: {
      bearing: 0,
      latitude: 0,
      longitude: 0,
      pitch: 0,
      zoom: 1
    },
    container: 'map',
    ...options
  };

  const containers = createCanvas(chosenOptions.container);

  const style = CartoMapStyle[chosenOptions.basemap.toUpperCase() as keyof typeof CartoMapStyle];
  if (style === undefined)
    throw new CartoBaseMapError(`Basemap ${chosenOptions.basemap} not available`);

  const map = new mapboxgl.Map({
    container: containers.mapCanvas,
    style,
    // Note: deck.gl will be in charge of interaction and event handling
    interactive: false,
    center: [chosenOptions.view.longitude, chosenOptions.view.latitude],
    zoom: chosenOptions.view.zoom,
    bearing: chosenOptions.view.bearing,
    pitch: chosenOptions.view.pitch
  });

  const deckMap = new Deck({
    canvas: containers.deckCanvas,
    controller: true,
    width: '100%',
    height: '100%',
    initialViewState: chosenOptions.view,
    layers: [],
    effects: [],
    onViewStateChange: ({ viewState }: IWithViewState) => {
      deckMap.setProps({ viewState });
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      });
    }
  });

  // add the overflow:hidden rule in order to prevent scroll-bar appearing
  // when popups reach the viewport boundary
  const mapContainer = getMapContainer(deckMap);

  if (mapContainer) {
    mapContainer.style.overflow = 'hidden';
  }

  return deckMap;
}
