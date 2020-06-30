import { Deck, WebMercatorViewport } from '@deck.gl/core';
import { CartoError } from '@/core/errors/CartoError';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import mitt from 'mitt';
import deepmerge from 'deepmerge';
import { GeoJSON } from 'geojson';
import { uuidv4 } from '@/core/utils/uuid';
import { WithEvents } from '@/core/mixins/WithEvents';
import { DatasetSource, SQLSource, GeoJSONSource, Source } from '@/viz';
import { DOLayer } from '../deck/DOLayer';
import { getStyles, StyleProperties, Style } from '../style';
import { ViewportFeaturesGenerator } from '../interactivity/viewport-features/ViewportFeaturesGenerator';
import { PopupElement } from '../popups/Popup';
import { StyledLayer } from '../style/layer-style';
import { CartoLayerError, layerErrorTypes } from '../errors/layer-error';
import { LayerInteractivity, InteractivityEventType } from './LayerInteractivity';
import { LayerOptions } from './LayerOptions';
import { FiltersCollection } from '../filters/FiltersCollection';
import { FunctionFilterApplicator } from '../filters/FunctionFilterApplicator';
import { ColumnFilters } from '../filters/types';
import { basicStyle } from '../style/helpers/basic-style';

export class Layer extends WithEvents implements StyledLayer {
  private _source: Source;
  private _style: Style;
  private _options: LayerOptions;

  // Deck.gl Map instance
  private _deckInstance: Deck | undefined;

  // Instance to the DeckLayer of the instance
  // It cannot be a reference to (import { Layer } from '@deck.gl/core') because
  // the typing of getPickinfo method is different from TileLayer and Layer are
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _deckLayer?: any;

  private _interactivity: LayerInteractivity;

  // Viewport Features Generator instance to get current features within viewport
  private _viewportFeaturesGenerator = new ViewportFeaturesGenerator();

  // pickable events count
  private _pickableEventsCount = 0;

  private filtersCollection = new FiltersCollection<ColumnFilters, FunctionFilterApplicator>(
    FunctionFilterApplicator
  );
  private callToViewportLoad = false;

  constructor(
    source: string | Source,
    style: Style | StyleProperties = basicStyle(),
    options?: Partial<LayerOptions>
  ) {
    super();

    this._source = buildSource(source);
    this._style = buildStyle(style);

    this.registerAvailableEvents([
      'viewportLoad',
      'filterChange',
      InteractivityEventType.CLICK.toString(),
      InteractivityEventType.HOVER.toString()
    ]);

    this._options = {
      id: `${this._source.id}-${uuidv4()}`,
      ...options
    };

    this._interactivity = this._buildInteractivity(options);
  }

  getMapInstance(): Deck {
    if (this._deckInstance === undefined) {
      throw new CartoLayerError(
        'Cannot return map instance because the layer has not been added to a map yet',
        layerErrorTypes.DECK_MAP_NOT_FOUND
      );
    }

    return this._deckInstance;
  }

  /**
   * Change a source to the current layer.
   * A new map instantion and a replace of the layer will be fired
   * @param source source to be set
   */
  public async setSource(source: string | Source) {
    this._source = buildSource(source);

    if (this._deckLayer) {
      await this.replaceDeckGLLayer();
    }
  }

  /**
   * Change the styles of the current layer.
   * A new map instantion and a replace of the layer will be fired
   * @param style style to be set
   */
  public async setStyle(style: Style) {
    this._style = buildStyle(style);

    if (this._deckLayer) {
      await this.replaceDeckGLLayer();
    }
  }

  /**
   * Retrieves the current style of the layer
   */
  public getStyle() {
    let styleProps;

    if (this._style) {
      styleProps = this._style.getLayerProps(this);
    }

    const metadata = this._source.getMetadata();
    const defaultStyleProps = getStyles(metadata.geometryType);

    return new Style({
      ...defaultStyleProps,
      ...styleProps
    });
  }

  /**
   * Add the current layer to a Deck map instance.
   * By default the layer will be the last positioned (on top).
   * To achieve a custom ordering, `beforeLayerId` or `afterLayerId` options can be used (and then the
   * referenced layer must have an `id`)
   *
   * Example:
   * ```javascript
   *    const layer1 = new Layer('dataset', {}, { id: 'layer1' });
   *    await layer1.addTo(deckMap);
   *
   *    const layer2 = new Layer('dataset2', {}, { id: 'layer2' });
   *    await layer2.addTo(deckMap, { beforeLayerId: 'layer1' });
   *
   * // at this point, the order would be 'layer2' < 'layer1' and not the opposite
   * ```
   *
   * **NOTE**
   * This is an `async` method, which means it has to perform some asynchronous operations to prepare
   * the layer for rendering. So if you want to ensure it has been effectively added (for example to
   * add more layers or to use it in a `DataView` then you must use `await` for it to finish.
   *
   * @param {Deck} instance of the map to add the layer to
   * @param {{ beforeLayerId?: string; afterLayerId?: string }} [opts={}] options to control relative layer position
   * @memberof Layer
   */
  public async addTo(deckInstance: Deck, opts: LayerPosition = {}) {
    const createdDeckGLLayer = await this.createDeckGLLayer();

    // collection may have changed during instantiation...
    const layers = [...deckInstance.props.layers];

    addInTheRightPosition(createdDeckGLLayer, layers, opts);

    const hasGeoJsonLayer = layers.some(layer => layer instanceof GeoJsonLayer);

    const { onViewStateChange } = deckInstance.props;
    deckInstance.setProps({
      layers,
      onViewStateChange: args => {
        const { interactionState, viewState } = args;

        if ((interactionState.isPanning || interactionState.isZooming) && hasGeoJsonLayer) {
          const viewport = new WebMercatorViewport(viewState);
          this._viewportFeaturesGenerator.setViewport(viewport);
          this.callToViewportLoad = true;
        }

        if (onViewStateChange) {
          onViewStateChange(args); // keep stateless view management, if set up initially
        }
      },
      onAfterRender: () => {
        if (this.callToViewportLoad) {
          this.callToViewportLoad = false;
          this.emit('viewportLoad');
        }
      }
    });

    this._deckInstance = deckInstance;

    this._interactivity.setDeckInstance(deckInstance);

    this._viewportFeaturesGenerator.setDeckInstance(deckInstance);
    this._viewportFeaturesGenerator.setDeckLayer(createdDeckGLLayer);

    if (hasGeoJsonLayer) {
      this.emit('viewportLoad');
    }
  }

  /**
   * Sets the layer as pickable and relay on the event manager
   *
   * @param eventType - Event type
   * @param eventHandler - Event handler defined by the user
   */
  public async on(eventType: InteractivityEventType | string, eventHandler: mitt.Handler) {
    // mark the layer as pickable
    if (eventType === InteractivityEventType.CLICK || eventType === InteractivityEventType.HOVER) {
      this._pickableEventsCount += 1;

      if (!this._options.pickable) {
        this._options.pickable = true;
      }

      if (this._deckLayer) {
        await this.replaceDeckGLLayer();
      }
    }

    super.on(eventType as string, eventHandler);
  }

  /**
   * Sets the layer as non-pickable if there are no events
   * attached to it and relay on the event manager
   *
   * @param eventType - Event type
   * @param eventHandler - Event handler defined by the user
   */
  public async off(eventType: InteractivityEventType | string, eventHandler: mitt.Handler) {
    // mark the layer as non-pickable
    if (
      (eventType === InteractivityEventType.CLICK || eventType === InteractivityEventType.HOVER) &&
      this._pickableEventsCount > 0
    ) {
      this._pickableEventsCount -= 1;

      if (this._pickableEventsCount === 0 && this._options.pickable === true) {
        this._options.pickable = false;

        if (this._deckLayer) {
          await this.replaceDeckGLLayer();
        }
      }
    }

    super.off(eventType as string, eventHandler);
  }

  /**
   * Method to create the Deck.gl layer
   */
  private async createDeckGLLayer() {
    this._addStyleFields();

    // The first step is to initialize the source to get the geometryType and the stats
    await this._source.init();

    const layerProperties = await this._getLayerProperties();

    // Create the Deck.gl instance
    if (this._source.sourceType === 'SQLSource' || this._source.sourceType === 'DatasetSource') {
      this._deckLayer = new MVTLayer(layerProperties);
    } else if (this._source.sourceType === 'GeoJSONSource') {
      if (layerProperties._isIconLayer) {
        this._deckLayer = new IconLayer(layerProperties);
      } else {
        this._deckLayer = new GeoJsonLayer(layerProperties);
      }
    } else if (this._source.sourceType === 'DOSource') {
      this._deckLayer = new DOLayer(layerProperties);
    } else {
      throw new CartoLayerError('Unsupported source instance', layerErrorTypes.UNKNOWN_SOURCE);
    }

    return this._deckLayer;
  }

  public async getViewportFeatures(excludedFilters: string[] = []) {
    if (!this._viewportFeaturesGenerator.isReady()) {
      throw new CartoError({
        type: 'Layer',
        message:
          'Cannot retrieve viewport features because this layer has not been added to a map yet'
      });
    }

    let features = await this._viewportFeaturesGenerator.getFeatures();
    const filters = this.filtersCollection.getApplicatorInstance(excludedFilters);

    if (this.filtersCollection.hasFilters()) {
      features = features.filter(feature => filters.applicator(feature));
    }

    return features;
  }

  private _getLayerProperties() {
    const props = this._source.getProps();
    const styleProps = this.getStyle().getLayerProps(this);
    const filters = this.filtersCollection.getApplicatorInstance();

    const events = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onViewportLoad: (...args: any) => {
        // TODO(jbotella): Change typings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const styleProperties = styleProps as any;

        if (styleProperties.onViewportLoad) {
          styleProperties.onViewportLoad(...args);
        }

        this.emit('viewportLoad');
      },
      onClick: this._interactivity.onClick.bind(this._interactivity),
      onHover: this._interactivity.onHover.bind(this._interactivity)
    };

    const layerProps = {
      ...this._options,
      ...props,
      ...styleProps,
      ...events,
      ...filters.getOptions()
    };

    // Merge Update Triggers to avoid overriding
    // TODO: We should split regular properties from
    // updateTriggers
    layerProps.updateTriggers = deepmerge.all([
      layerProps.updateTriggers || {},
      this.filtersCollection.getUpdateTriggers()
    ]);

    return ensureRelatedStyleProps(layerProps);
  }

  /**
   * Replace the deck layer with a fresh new one, keeping its order
   */
  public async replaceDeckGLLayer() {
    if (this._deckInstance) {
      const originalPosition = this._deckInstance.props.layers.findIndex(
        (layer: { id: string }) => layer.id === this._options.id
      );

      const otherDeckLayers = this._deckInstance.props.layers.filter(
        (layer: { id: string }) => layer.id !== this._options.id
      );

      const updatedLayers = [...otherDeckLayers];
      const newLayer = await this.createDeckGLLayer();
      updatedLayers.splice(originalPosition, 0, newLayer);

      this._deckInstance.setProps({
        layers: updatedLayers
      });

      this._viewportFeaturesGenerator.setDeckLayer(newLayer);
    }
  }

  public async getDeckGLLayer() {
    if (this._deckLayer === undefined) {
      this._deckLayer = await this.createDeckGLLayer();
    }

    return this._deckLayer;
  }

  public get source() {
    return this._source;
  }

  /**
   * @public
   * This method creates popups every time the
   * user clicks on one or more features of the layer.
   */
  public async setPopupClick(elements: PopupElement[] | string[] | null = []) {
    this._addPopupFields(elements);
    await this._interactivity.setPopupClick(elements);
  }

  public async setPopupHover(elements: PopupElement[] | string[] | null = []) {
    this._addPopupFields(elements);
    await this._interactivity.setPopupHover(elements);
  }

  public remove() {
    if (this._deckInstance === undefined) {
      throw new CartoLayerError(
        'This layer cannot be removed because it is not added to a map',
        layerErrorTypes.DECK_MAP_NOT_FOUND
      );
    }

    const deckLayers = this._deckInstance.props.layers.filter(
      (layer: { id: string }) => layer.id !== this._options.id
    );

    this._deckInstance.setProps({
      layers: deckLayers
    });
  }

  private _buildInteractivity(options: Partial<LayerOptions> = {}) {
    let hoverStyle;

    if (options.hoverStyle) {
      hoverStyle =
        typeof options.hoverStyle === 'string'
          ? options.hoverStyle
          : buildStyle(options.hoverStyle as Style | StyleProperties);
    }

    let clickStyle;

    if (options.clickStyle) {
      clickStyle =
        typeof options.clickStyle === 'string'
          ? options.clickStyle
          : buildStyle(options.clickStyle as Style | StyleProperties);
    }

    const layerGetStyleFn = this.getStyle.bind(this);
    const layerSetStyleFn = this.setStyle.bind(this);
    const layerEmitFn = this.emit.bind(this);
    const layerOnFn = this.on.bind(this);
    const layerOffFn = this.off.bind(this);

    return new LayerInteractivity({
      layer: this,
      layerGetStyleFn,
      layerSetStyleFn,
      layerEmitFn,
      layerOnFn,
      layerOffFn,
      hoverStyle,
      clickStyle
    });
  }

  addFilter(filterId: string, filter: ColumnFilters) {
    this.filtersCollection.addFilter(filterId, filter);
    this.emit('filterChange');

    if (this._deckLayer) {
      return this.replaceDeckGLLayer();
    }

    return Promise.resolve();
  }

  removeFilter(filterId: string) {
    this.filtersCollection.removeFilter(filterId);
    this.emit('filterChange');

    if (this._deckLayer) {
      return this.replaceDeckGLLayer();
    }

    return Promise.resolve();
  }

  public setFilters(filters: ColumnFilters) {
    this.filtersCollection.clear();
    this.filtersCollection.addFilter(uuidv4(), filters);
    this.emit('filterChange');

    if (this._deckLayer) {
      return this.replaceDeckGLLayer();
    }

    return Promise.resolve();
  }

  addSourceField(field: string) {
    this._source.addField(field);
    return this.replaceDeckGLLayer();
  }

  private _addStyleFields() {
    if (this._style && this._style.field) {
      this._source.addField(this._style.field);
    }
  }

  private _addPopupFields(elements: PopupElement[] | string[] | null = []) {
    if (elements) {
      elements.forEach((e: PopupElement | string) => {
        const field = typeof e === 'string' ? e : e.attr;
        this._source.addField(field);
      });
    }
  }
}

/**
 * Internal function to auto convert string to CARTO source
 * @param source source object to be converted
 */
function buildSource(source: string | Source | GeoJSON): Source {
  if (source instanceof Source) {
    return source;
  }

  if (typeof source === 'string') {
    if (source.search(' ') > -1) {
      return new SQLSource(source);
    }

    return new DatasetSource(source);
  }

  if (typeof source === 'object') {
    return new GeoJSONSource(source);
  }

  throw new CartoLayerError('Unsupported source type', layerErrorTypes.UNKNOWN_SOURCE);
}

function buildStyle(style: Style | StyleProperties) {
  return style instanceof Style ? style : new Style(style);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureRelatedStyleProps(layerProps: any) {
  const layerPropsValidated = layerProps;

  if (layerPropsValidated.pointRadiusScale) {
    layerPropsValidated.pointRadiusMaxPixels *= layerPropsValidated.pointRadiusScale;
    layerPropsValidated.pointRadiusMinPixels *= layerPropsValidated.pointRadiusScale;
  }

  if (layerPropsValidated.getLineWidth === 0) {
    layerPropsValidated.stroked = false;
  }

  return layerPropsValidated;
}

function addInTheRightPosition(deckglLayer: any, layers: any[], opts: LayerPosition = {}) {
  const { beforeLayerId, afterLayerId } = opts;

  if (beforeLayerId && afterLayerId) {
    throw new CartoLayerError(
      'Cannot use beforeLayerId and afterLayerId at the same time',
      layerErrorTypes.DEFAULT
    );
  }

  if (beforeLayerId || afterLayerId) {
    const beforeAfterLayerIdx = layers.findIndex(l => l.id === beforeLayerId || afterLayerId);

    if (beforeAfterLayerIdx !== -1) {
      if (beforeLayerId) {
        layers.splice(beforeAfterLayerIdx, 0, deckglLayer);
      } else if (afterLayerId) {
        layers.splice(beforeAfterLayerIdx + 1, 0, deckglLayer);
      }
    } else {
      layers.push(deckglLayer);
    }
  } else {
    layers.push(deckglLayer);
  }
}

interface LayerPosition {
  beforeLayerId?: string;
  afterLayerId?: string;
}
