import { Layer } from '../layer/Layer';
import { InteractivityEvent, LayerInteractivity } from '../layer/LayerInteractivity';
import { Popup } from '../popups/Popup';

const FAKE_COORDS = [0, 0];
const FEATURE = { type: 'feature', properties: { cartodb_id: '15', pop: 10435000 } };

let layer: Layer;
let setContentMockClick: jasmine.Spy;
let setContentMockHover: jasmine.Spy;

beforeEach(() => {
  layer = new Layer('fake_source');

  const sourceData = [
    FEATURE,
    { type: 'feature', properties: { cartodb_id: '3', pop: 30 } },
    { type: 'feature', properties: { cartodb_id: '4', pop: 40 } },
    { type: 'feature', properties: { cartodb_id: '5', pop: null } },
    { type: 'feature', properties: { cartodb_id: '6', pop: undefined } },
    { type: 'feature', properties: { cartodb_id: '7', pop: 50 } },
    { type: 'feature', properties: { cartodb_id: '8', pop: 90 } }
  ];

  spyOn(layer, 'getViewportFeatures').and.returnValue(Promise.resolve(sourceData));

  const popupClick = new Popup();
  setContentMockClick = spyOn(popupClick, 'setContent');
  const popupHover = new Popup();
  setContentMockHover = spyOn(popupHover, 'setContent');

  const interactivity = new LayerInteractivity({
    layer,
    layerGetStyleFn: layer.getStyle.bind(layer),
    layerSetStyleFn: layer.setStyle.bind(layer),
    layerEmitFn: layer.emit.bind(layer),
    layerOnFn: layer.on.bind(layer),
    layerOffFn: layer.off.bind(layer)
  });
  Object.defineProperty(layer, '_interactivity', { value: interactivity });
  Object.defineProperty(interactivity, '_clickPopup', { value: popupClick });
  Object.defineProperty(interactivity, '_hoverPopup', { value: popupHover });
});

describe('interaction popup', () => {
  const DEFAULT_TITLE = ['pop'];
  const CUSTOM_PARAM = [
    {
      attr: 'cartodb_id',
      title: null // hide the title of this field
    },
    {
      attr: 'pop',
      title: 'Population D3'
    },
    {
      attr: 'pop',
      title: 'Population Custom',
      format: (value: number) => value.toString().replace(/000$/, 'K habitants')
    }
  ];

  describe('setPopupClick', () => {
    it('should show a popup when a feature is clicked with default title', async () => {
      await layer.setPopupClick(DEFAULT_TITLE);

      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockClick).toHaveBeenCalledWith(`<p class="as-body">pop</p>
              <p class="as-subheader as-font--medium">10435000</p>`);
    });
    it('should show a popup when a feature is clicked with a custom title, no format and custom format function', async () => {
      await layer.setPopupClick(CUSTOM_PARAM);

      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockClick).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
    });
    it('should do nothing if no parameter is provided', async () => {
      await layer.setPopupClick();

      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockClick).toHaveBeenCalledTimes(0);
    });
    it('should do nothing if the parameter provided is null', async () => {
      await layer.setPopupClick(null);

      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockClick).toHaveBeenCalledTimes(0);
    });
    it('should stop showing a popup with a custom title and format after call the method with no parameters', async () => {
      await layer.setPopupClick(CUSTOM_PARAM);
      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);

      await layer.setPopupClick();
      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);

      expect(setContentMockClick).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
      expect(setContentMockClick).toHaveBeenCalledTimes(1);
    });
    it('should stop showing a popup with a custom title and format after call the method with null', async () => {
      await layer.setPopupClick(CUSTOM_PARAM);
      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);

      await layer.setPopupClick(null);
      layer.emit(InteractivityEvent.CLICK, [[FEATURE], FAKE_COORDS]);

      expect(setContentMockClick).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
      expect(setContentMockClick).toHaveBeenCalledTimes(1);
    });
  });
  describe('setPopupHover', () => {
    it('should show a popup when a feature is hovered with default title', async () => {
      await layer.setPopupHover(DEFAULT_TITLE);

      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockHover).toHaveBeenCalledWith(`<p class="as-body">pop</p>
              <p class="as-subheader as-font--medium">10435000</p>`);
    });
    it('should show a popup when a feature is hovered with a custom title, D3 format and custom format function', async () => {
      await layer.setPopupHover(CUSTOM_PARAM);

      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockHover).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
    });
    it('should do nothing if no parameter is provided', async () => {
      await layer.setPopupHover();

      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockHover).toHaveBeenCalledTimes(0);
    });
    it('should do nothing if the parameter provided is null', async () => {
      await layer.setPopupHover(null);

      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);
      expect(setContentMockHover).toHaveBeenCalledTimes(0);
    });
    it('should stop showing a popup with a custom title and format after call the method with no parameters', async () => {
      await layer.setPopupHover(CUSTOM_PARAM);
      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);

      await layer.setPopupHover();
      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);

      expect(setContentMockHover).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
      expect(setContentMockHover).toHaveBeenCalledTimes(1);
    });
    it('should stop showing a popup with a custom title and format after call the method with null', async () => {
      await layer.setPopupHover(CUSTOM_PARAM);
      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);

      await layer.setPopupHover(null);
      layer.emit(InteractivityEvent.HOVER, [[FEATURE], FAKE_COORDS]);

      expect(setContentMockHover).toHaveBeenCalledWith(`<p class="as-body"></p>
              <p class="as-subheader as-font--medium">15</p><p class="as-body">Population D3</p>
              <p class="as-subheader as-font--medium">10435000</p><p class="as-body">Population Custom</p>
              <p class="as-subheader as-font--medium">10435K habitants</p>`);
      expect(setContentMockHover).toHaveBeenCalledTimes(1);
    });
  });
});
