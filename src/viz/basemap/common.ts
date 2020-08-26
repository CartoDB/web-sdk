import { CartoBaseMapError } from '../errors/basemap-error';

const CANVAS_STYLE = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%'
};

export function createCanvas(container: HTMLElement | string) {
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
