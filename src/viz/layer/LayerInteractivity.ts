import { Deck, RGBAColor } from '@deck.gl/core';
import { Popup, PopupElement, PopupOptions } from '../popups/Popup';
import { Style, StyleProperties } from '../style/Style';
import { StyledLayer } from '../style/layer-style';

export class LayerInteractivity {
  private _deckInstance?: Deck;

  private _clickPopup?: Popup;
  private _hoverPopup?: Popup;

  private _hoverFeature?: Record<string, any>;
  private _clickFeature?: Record<string, any>;

  private _hoverStyle?: Style | string;
  private _clickStyle?: Style | string;

  private _layerGetStyleFn: () => Promise<Style>;
  private _layerSetStyleFn: (style: Style) => Promise<void>;

  private _layerOnFn: EventHandler;
  private _layerOffFn: EventHandler;

  private _layer: StyledLayer;

  private _layerEmitFn: (type: string, event?: unknown) => void;

  private _clickPopupHandler?: InteractionHandler;
  private _hoverPopupHandler?: InteractionHandler;

  constructor(options: LayerInteractivityOptions) {
    this._layer = options.layer;

    this._hoverStyle = options.hoverStyle;
    this._clickStyle = options.clickStyle;

    this._layerGetStyleFn = options.layerGetStyleFn;
    this._layerSetStyleFn = options.layerSetStyleFn;

    this._layerOnFn = options.layerOnFn;
    this._layerOffFn = options.layerOffFn;

    if (this._clickStyle) {
      this._layerOnFn(InteractivityEvent.CLICK, () => {
        this._wrapInteractiveStyle().then(interactiveStyle =>
          this._layerSetStyleFn(interactiveStyle)
        );
      });
    }

    if (this._hoverStyle) {
      this._layerOnFn(InteractivityEvent.HOVER, () => {
        this._wrapInteractiveStyle().then(interactiveStyle =>
          this._layerSetStyleFn(interactiveStyle)
        );
      });
    }

    this._layerEmitFn = options.layerEmitFn;
  }

  public onClick(info: any, event: HammerInput) {
    this.fireOnEvent(InteractivityEvent.CLICK, info, event);
  }

  public onHover(info: any, event: HammerInput) {
    this.fireOnEvent(InteractivityEvent.HOVER, info, event);
  }

  public async fireOnEvent(eventType: InteractivityEvent, info: any, event: HammerInput) {
    const features = [];
    const { coordinate, object } = info;

    if (object) {
      features.push(object);
    }

    if (eventType === InteractivityEvent.CLICK) {
      this._clickFeature = object;
    } else if (eventType === InteractivityEvent.HOVER) {
      this._hoverFeature = object;
      this._setStyleCursor(info);
    }

    if (this._clickStyle || this._hoverStyle) {
      const interactiveStyle = await this._wrapInteractiveStyle();
      this._layerSetStyleFn(interactiveStyle);
    }

    this._layerEmitFn(eventType.toString(), [features, coordinate, event]);
  }

  public setDeckInstance(deckInstance: Deck) {
    this._deckInstance = deckInstance;

    if (this._clickPopup) {
      this._clickPopup.addTo(this._deckInstance);
    }

    if (this._hoverPopup) {
      this._hoverPopup.addTo(this._deckInstance);
    }
  }

  /**
   * @public
   * This method creates popups every time the
   * user clicks on one or more features of the layer.
   */
  public async setPopupClick(
    elements: PopupElement[] | string[] | null = [],
    options: Partial<PopupOptions> = {}
  ) {
    // if the popup was not created yet then we create it and add it to the map
    if (!this._clickPopup) {
      this._clickPopup = new Popup(options);

      if (this._deckInstance) {
        this._clickPopup.addTo(this._deckInstance);
      }
    }

    await this._popupHandler(InteractivityEvent.CLICK, this._clickPopup, elements);
  }

  public async setPopupHover(
    elements: PopupElement[] | string[] | null = [],
    options: Partial<PopupOptions> = { closeButton: false }
  ) {
    // if the popup was not created yet then we create it and add it to the map
    if (!this._hoverPopup) {
      this._hoverPopup = new Popup(options);

      if (this._deckInstance) {
        this._hoverPopup.addTo(this._deckInstance);
      }
    }

    await this._popupHandler(InteractivityEvent.HOVER, this._hoverPopup, elements);
  }

  private async _popupHandler(
    eventType: InteractivityEvent,
    popup: Popup,
    elements: PopupElement[] | string[] | null = []
  ) {
    let handlerFn;

    if (eventType === InteractivityEvent.CLICK) {
      if (!this._clickPopupHandler) {
        this._clickPopupHandler = popup.createHandler(elements);
      }

      handlerFn = this._clickPopupHandler;
    } else {
      if (!this._hoverPopupHandler) {
        this._hoverPopupHandler = popup.createHandler(elements);
      }

      handlerFn = this._hoverPopupHandler;
    }

    if (elements && elements.length > 0) {
      // can reinit source
      await this._layerOnFn(eventType, handlerFn);
    } else if (!elements || elements.length === 0) {
      if (popup) {
        popup.close();
      }

      await this._layerOffFn(eventType, handlerFn);
    }
  }

  /**
   * Wraps the style defined by the user with new functions
   * to check if the feature received by paramter has been clicked
   * or hovered by the user in order to apply the interaction style
   */
  private async _wrapInteractiveStyle() {
    const wrapInteractiveStyle = { updateTriggers: {} };

    const currentStyle = await this._layerGetStyleFn();
    const styleProps = await currentStyle.getLayerProps(this._layer);

    let clickStyleProps = {};

    if (this._clickStyle === 'default') {
      const defaultHighlightStyle = await this._getDefaultHighlightStyle();
      clickStyleProps = await defaultHighlightStyle.getLayerProps(this._layer);
    } else if (this._clickStyle instanceof Style) {
      clickStyleProps = await this._clickStyle.getLayerProps(this._layer);
    }

    let hoverStyleProps = {};

    if (this._hoverStyle === 'default') {
      const defaultHighlightStyle = await this._getDefaultHighlightStyle();
      hoverStyleProps = await defaultHighlightStyle.getLayerProps(this._layer);
    } else if (this._hoverStyle instanceof Style) {
      hoverStyleProps = await this._hoverStyle.getLayerProps(this._layer);
    }

    const source = this._layer.getSource();
    const { uniqueIdProperty } = source.getMetadata();

    type simpleFeature = Record<string, any>;
    let sameFeatureFn: any;

    if (uniqueIdProperty) {
      sameFeatureFn = (f1: simpleFeature, f2: simpleFeature): boolean => {
        return f1.properties[uniqueIdProperty] === f2.properties[uniqueIdProperty];
      };
    } else {
      sameFeatureFn = (f1: simpleFeature, f2: simpleFeature): boolean => {
        return f1 === f2;
      };
    }

    Object.keys({
      ...clickStyleProps,
      ...hoverStyleProps
    }).forEach(styleProp => {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      const defaultStyleValue = styleProps[styleProp];
      // @ts-ignore
      const clickStyleValue = clickStyleProps[styleProp];
      // @ts-ignore
      const hoverStyleValue = hoverStyleProps[styleProp];
      /* eslint-enable @typescript-eslint/ban-ts-comment */

      /**
       * Funtion which wraps the style property. Check if the
       * received feature was clicked or hovered by the user in order
       * to apply the style.
       *
       * @param feature which the style will be applied to.
       */
      const interactionStyleFn = (feature: Record<string, any>) => {
        let styleValue;

        if (feature) {
          if (this._clickFeature && sameFeatureFn(feature, this._clickFeature)) {
            styleValue = clickStyleValue;
          } else if (this._hoverFeature && sameFeatureFn(feature, this._hoverFeature)) {
            styleValue = hoverStyleValue;
          }
        }

        if (!styleValue) {
          styleValue = defaultStyleValue;
        }

        return typeof styleValue === 'function' ? styleValue(feature) : styleValue;
      };

      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      wrapInteractiveStyle[styleProp] = interactionStyleFn;
      // @ts-ignore
      wrapInteractiveStyle.updateTriggers[styleProp] = interactionStyleFn;
      /* eslint-enable @typescript-eslint/ban-ts-comment */
    });

    return new Style({
      ...styleProps,
      ...wrapInteractiveStyle
    });
  }

  /**
   * Handler for set the style cursor if is
   * hover a feature.
   *
   * @param info - picked info from the layer
   */
  private _setStyleCursor(info: any) {
    if (this._deckInstance) {
      this._deckInstance.setProps({
        getCursor: () => (info.object ? 'pointer' : 'grab')
      });
    }
  }

  private async _getDefaultHighlightStyle() {
    const defaultHighlightProps: StyleProperties = {};
    const styleProps = await (await this._layerGetStyleFn()).getLayerProps(this._layer);

    if (styleProps.getIcon) {
      // icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getIconProps: any = styleProps.getIcon(null);
      const { url } = getIconProps;
      defaultHighlightProps.getIcon = {
        ...getIconProps,
        url: `${url}?v=highlight`,
        mask: true
      };
      defaultHighlightProps.getColor = defaultHighlightStyle.getFillColor;
    } else if (styleProps.getFillColor) {
      // polygons or points
      defaultHighlightProps.getFillColor = defaultHighlightStyle.getFillColor;
      defaultHighlightProps.getLineWidth = defaultHighlightStyle.getLineWidth;
      defaultHighlightProps.getLineColor = defaultHighlightStyle.getLineColor;
    } else {
      // lines: for lines we just set the line color as fill color in points and polygons
      defaultHighlightProps.getLineColor = defaultHighlightStyle.getFillColor;
    }

    return new Style(defaultHighlightProps);
  }
}

/**
 * Layer interactivity options
 */
export interface LayerInteractivityOptions {
  /**
   * StyledLayer which will be used to apply the
   * highlight styles to
   */
  layer: StyledLayer;

  /**
   * getStyle method of the layer
   */
  layerGetStyleFn: () => Promise<Style>;

  /**
   * setStyle method of the layer
   */
  layerSetStyleFn: (style: Style) => Promise<void>;

  /**
   * emit method of the layer
   */
  layerEmitFn: (type: string, event?: unknown) => void;

  /**
   * on method of the layer
   */
  layerOnFn: EventHandler;

  /**
   * off method of the layer
   */
  layerOffFn: EventHandler;

  /**
   * hover style for this layer. Could be
   * 'default' for defaultHighlightStyle style
   */
  hoverStyle?: Style | string;

  /**
   * click style for this layer. Could be
   * 'default' for defaultHighlightStyle style
   */
  clickStyle?: Style | string;
}

export enum InteractivityEvent {
  HOVER = 'hover',
  CLICK = 'click'
}

export type InteractionHandler = (eventResult: EventResult) => void;

type EventHandler = (type: InteractivityEvent, handler: InteractionHandler) => void;

type EventResult = [Record<string, any>[], number[], HammerInput];

const defaultHighlightStyle = {
  getFillColor: [255, 255, 0, 255] as RGBAColor,
  getLineWidth: 5,
  getLineColor: [220, 220, 0, 255] as RGBAColor
};
