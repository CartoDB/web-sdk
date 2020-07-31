export function getMapContainer(deckInstance: unknown) {
  let mapContainer;
  const canvasElem = getCanvas(deckInstance);

  if (canvasElem && canvasElem.parentElement) {
    mapContainer = canvasElem.parentElement;
  }

  return mapContainer;
}

export function getCanvas(deckInstance: unknown) {
  // TODO(jbotella): Fix Deck.gl types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { canvas } = (deckInstance as any).props;
  const canvasElem =
    typeof canvas === 'string' ? document.getElementById(canvas) : (canvas as HTMLElement);
  return canvasElem;
}
