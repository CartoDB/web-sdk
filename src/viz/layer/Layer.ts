import { Deck, WebMercatorViewport } from '@deck.gl/core';
import { CartoError } from '@/core/errors/CartoError';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import ViewState from '@deck.gl/core/controllers/view-state';
import mitt from 'mitt';
import deepmerge from 'deepmerge';
import { GeoJSON } from 'geojson';
import { uuidv4 } from '@/core/utils/uuid';
import { WithEvents } from '@/core/mixins/WithEvents';
import { DatasetSource, SQLSource, GeoJSONSource, Source } from '@/viz';
import { LegendWidgetOptions, LegendProperties } from '@/viz/legend';
import { debounce } from '@/viz/core/utils';
import { AggregatedColumn } from '../source/Source';
import { DOLayer } from '../deck/DOLayer';
import { getStyles, StyleProperties, Style } from '../style';
import { ViewportFeaturesGenerator } from '../interactivity/viewport-features/ViewportFeaturesGenerator';
import { ViewportFeaturesQueue } from '../interactivity/viewport-features/ViewportFeaturesQueue';
import { PopupElement, PopupOptions } from '../popups/Popup';
import { StyledLayer } from '../style/layer-style';
import { CartoLayerError, layerErrorTypes } from '../errors/layer-error';
import { LayerInteractivity, InteractivityEvent } from './LayerInteractivity';
import { LayerOptions } from './LayerOptions';
import { FiltersCollection } from '../filters/FiltersCollection';
import { FunctionFilterApplicator } from '../filters/FunctionFilterApplicator';
import { ColumnFilters } from '../filters/types';
import { basicStyle } from '../style/helpers/basic-style';

export enum LayerEvent {
  DATA_READY = 'dataReady',
  DATA_CHANGED = 'dataChanged',
  FILTER_CHANGE = 'filterChange' // must be the same value as GenericDataSourceEvent.FILTER_CHANGE
}

export class Layer extends WithEvents implements StyledLayer {
  // #region Private props
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
  private _visible = true;

  // Helper class to manage interactivity
  private _interactivity: LayerInteractivity;

  // Viewport Features Generator instance to get current features within viewport
  private _viewportFeaturesGenerator = new ViewportFeaturesGenerator();

  // Viewport Features Queue instance to enqueue calls to ViewportFeaturesGenerator
  private _viewportFeaturesQueue = new ViewportFeaturesQueue();

  // pickable events count
  private _pickableEventsCount = 0;

  // set of filters to apply
  private filtersCollection = new FiltersCollection<ColumnFilters, FunctionFilterApplicator>(
    FunctionFilterApplicator
  );

  private dataState: DATA_STATES = DATA_STATES.STARTING;

  /**
   * Debounce scope to prevent multiple calls
   * to this._sendDataEvent('onAfterRender') and this._sendDataEvent('onViewportLoad')
   */
  private setOptionScope: { timeoutId?: number } = {};

  // #endregion

  // #region Public methods
  constructor(
    source: string | Source,
    style: Style | StyleProperties = basicStyle(),
    options?: Partial<LayerOptions>
  ) {
    super();

    this.registerAvailableEvents([
      LayerEvent.DATA_READY,
      LayerEvent.DATA_CHANGED,
      LayerEvent.FILTER_CHANGE,
      InteractivityEvent.CLICK,
      InteractivityEvent.HOVER
    ]);

    this._source = buildSource(source);
    this._style = this._buildStyle(style);

    this._options = {
      id: `${this._source.id}-${uuidv4()}`,
      ...options
    };

    this._interactivity = this._buildInteractivityHelper(options);
    this.dataState = DATA_STATES.STARTING;
  }

  /**
   * Get the `id` that identifies the layer. That id is explicitly set during construction (or
   * an automatically created one).
   */
  public getId(): string {
    return this._options.id;
  }

  /**
   * Get the Deck `map` instance where the layer was included or undefined if it wasn't
   */
  public getMap(): Deck | undefined {
    return this._deckInstance;
  }

  /**
   * Get the data Source assigned to the layer
   *
   * @readonly
   * @type {Source}
   * @memberof Layer
   */
  public getSource(): Source {
    return this._source;
  }

  /**
   * Change the data Source for the layer.
   * A new map instantion and a replacement of the internal deckgl layer will be fired transparentely, if required
   * @param {(string | Source)} source to be set
   * @memberof Layer
   */
  public async setSource(source: string | Source) {
    this._source = buildSource(source);

    if (this._deckLayer) {
      await this.replaceDeckLayer();
      this.dataState = DATA_STATES.STARTING;
    }
  }

  /**
   * Retrieve the current Style, considering the latest updates
   *
   * @returns {Promise<Style>}
   * @memberof Layer
   */
  public async getStyle(): Promise<Style> {
    let styleProps;
    let viewport;

    if (this._style) {
      styleProps = await this._style.getLayerProps(this);
      viewport = this._style.viewport;
    }

    const metadata = this._source.getMetadata();
    const defaultStyleProps = getStyles(metadata.geometryType);

    return new Style(
      {
        ...defaultStyleProps,
        ...styleProps
      },
      undefined,
      undefined,
      viewport
    );
  }

  /**
   * Change the Style of the current layer.
   * A new map instantion and a replacement of the internal deckgl layer will be fired transparentely, if required
   * @param {Style} style to be set
   * @memberof Layer
   */
  public async setStyle(style: Style) {
    this._style = this._buildStyle(style);

    if (this._deckLayer) {
      await this.replaceDeckLayer();
    }
  }

  /**
   * Add the current layer to a Deck map instance.
   * By default the layer will be the last positioned (on top).
   * To achieve a custom ordering, `overLayerId` or `underLayerId` options can be used (and then the
   * referenced layer must have an `id`)
   *
   * Example:
   * ```javascript
   *    const layer1 = new Layer('dataset', {}, { id: 'layer1' });
   *    await layer1.addTo(deckMap);
   *
   *    const layer2 = new Layer('dataset2', {}, { id: 'layer2' });
   *    await layer2.addTo(deckMap, { overLayerId: 'layer1' });
   *
   * // at this point, the order would be 'layer2' < 'layer1' and not the opposite
   * ```
   *
   * **NOTE**
   * This is an `async` method, which means it has to perform some asynchronous operations to prepare
   * the layer for rendering. So if you want to ensure it has been effectively added (for example to
   * add more layers or to use it in a `DataView` then you must use `await` for it to finish.
   *
   * @param {Deck} deckInstance of the map to add the layer to
   * @param {LayerPosition} [opts={}] options to control relative layer position
   * @memberof Layer
   */
  public async addTo(deckInstance: Deck, opts: LayerPosition = {}) {
    this._deckInstance = deckInstance;

    const deckLayer = await this._createDeckLayer();

    // collection may have changed during instantiation...
    const layers = [...this._deckInstance.props.layers];

    addInTheRightPosition(deckLayer, layers, opts);

    const { onViewStateChange } = this._deckInstance.props;
    this._deckInstance.setProps({
      layers,
      onViewStateChange: args => {
        const { interactionState, viewState } = args;

        const { isPanning, isZooming, isRotating } = interactionState;
        this._saveDataState(!!isPanning || !!isZooming || !!isRotating, viewState);

        if (onViewStateChange) {
          onViewStateChange(args); // keep stateless view management, if set up initially
        }
      },
      onAfterRender: () => {
        this._sendDataEvent('onAfterRender');
      }
    });

    const { uniqueIdProperty } = this.getSource().getMetadata();

    this._interactivity.setDeckInstance(this._deckInstance);

    this._viewportFeaturesGenerator.setDeckInstance(this._deckInstance);
    this._viewportFeaturesGenerator.setDeckLayer(deckLayer);
    this._viewportFeaturesGenerator.setOptions({ uniqueIdProperty });
  }

  /**
   * Return if layer is visible
   */
  public isVisible(): boolean {
    return this._deckLayer && this._visible;
  }

  /**
   * Hide layer
   */
  public hide() {
    if (this._deckLayer === undefined) {
      throw new CartoLayerError(
        'This layer cannot be hidden because it is not added to a map',
        layerErrorTypes.DEFAULT
      );
    }

    this._visible = false;
    this.replaceDeckLayer();
  }

  /**
   * Show layer
   */
  public show() {
    if (this._deckLayer === undefined) {
      throw new CartoLayerError(
        'This layer cannot be displayed because it is not added to a map',
        layerErrorTypes.DEFAULT
      );
    }

    this._visible = true;
    this.replaceDeckLayer();
  }

  /**
   * Remove the current layer from the Deck map instance where it was added to
   *
   * @memberof Layer
   */
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

    this._deckInstance = undefined;
  }

  /**
   * Check if the layer source is ready
   *
   * @returns {boolean}
   * @memberof Layer
   */
  public isReady(): boolean {
    return this.dataState !== DATA_STATES.STARTING;
  }

  /**
   * TODO private?
   * Get the current deck layer.
   * If it doesn't exist yet, a new instance will be created
   *
   * @returns
   * @memberof Layer
   */
  public async getDeckLayer(): Promise<any> {
    if (this._deckLayer === undefined) {
      this._deckLayer = await this._createDeckLayer();
    }

    return this._deckLayer;
  }

  /**
   * Replace the deck layer with a fresh new one, considering latest updates.
   * It keeps the original order
   *
   * @memberof Layer
   */
  public async replaceDeckLayer() {
    if (this._deckInstance) {
      const newLayer = await this._createDeckLayer();

      const originalPosition = this._deckInstance.props.layers.findIndex(
        (layer: { id: string }) => layer.id === this._options.id
      );

      const otherDeckLayers = this._deckInstance.props.layers.filter(
        (layer: { id: string }) => layer.id !== this._options.id
      );

      const updatedLayers = [...otherDeckLayers];

      updatedLayers.splice(originalPosition, 0, newLayer);
      this._deckInstance.setProps({
        layers: updatedLayers
      });

      this._viewportFeaturesGenerator.setDeckLayer(newLayer);
    }
  }

  /**
   * Manage an interactivity event with a handler. It also sets the layer as pickable
   *
   * @param {(InteractivityEvent | string)} eventType
   * @param {mitt.Handler} eventHandler - callback defined on response
   * @memberof Layer
   */
  public async on(eventType: InteractivityEvent | string, eventHandler: mitt.Handler) {
    // mark the layer as pickable
    if (eventType === InteractivityEvent.CLICK || eventType === InteractivityEvent.HOVER) {
      this._pickableEventsCount += 1;

      if (!this._options.pickable) {
        this._options.pickable = true;
      }

      if (this._deckLayer) {
        await this.replaceDeckLayer();
      }
    }

    super.on(eventType as string, eventHandler);
  }

  /**
   * Stop managing an interactivity event with a handler.
   * It also sets the layer as non pickable if there are no more events
   *
   * @param {(InteractivityEvent | string)} eventType
   * @param {mitt.Handler} eventHandler - callback defined on response
   * @memberof Layer
   */
  public async off(eventType: InteractivityEvent | string, eventHandler: mitt.Handler) {
    // mark the layer as non-pickable
    if (
      (eventType === InteractivityEvent.CLICK || eventType === InteractivityEvent.HOVER) &&
      this._pickableEventsCount > 0
    ) {
      this._pickableEventsCount -= 1;

      if (this._pickableEventsCount === 0 && this._options.pickable === true) {
        this._options.pickable = false;

        if (this._deckLayer) {
          await this.replaceDeckLayer();
        }
      }
    }

    super.off(eventType as string, eventHandler);
  }

  /**
   * Display a popup every time the user clicks on a feature
   *
   * @param {(PopupElement[] | string[] | null)} [elements=[]]
   * @param {Partial<PopupOptions>} [options={}]
   * @memberof Layer
   */
  public async setPopupClick(
    elements: PopupElement[] | string[] | null = [],
    options: Partial<PopupOptions> = {}
  ) {
    this._addPopupFields(elements);
    await this._interactivity.setPopupClick(elements, options);
  }

  /**
   * Display a popup every time the user hovers over a feature
   *
   * @param {(PopupElement[] | string[] | null)} [elements=[]]
   * @param {Partial<PopupOptions>} [options={ closeButton: false }]
   * @memberof Layer
   */
  public async setPopupHover(
    elements: PopupElement[] | string[] | null = [],
    options: Partial<PopupOptions> = { closeButton: false, autoWidth: true }
  ) {
    this._addPopupFields(elements);
    await this._interactivity.setPopupHover(elements, options);
  }

  /**
   * TODO review if exposed?
   * Add a filter to the layer
   *
   * @param {string} filterId
   * @param {ColumnFilters} filter
   * @returns
   * @memberof Layer
   */
  public async addFilter(filterId: string, filter: ColumnFilters) {
    this.filtersCollection.addFilter(filterId, filter);
    this.emit(LayerEvent.FILTER_CHANGE);

    if (this._deckLayer) {
      return this.replaceDeckLayer();
    }

    return Promise.resolve();
  }

  /**
   * TODO review if exposed?
   * Remove a filter from the layer
   *
   * @param {string} filterId
   * @returns
   * @memberof Layer
   */
  public async removeFilter(filterId: string) {
    this.filtersCollection.removeFilter(filterId);
    this.emit(LayerEvent.FILTER_CHANGE);

    if (this._deckLayer) {
      return this.replaceDeckLayer();
    }

    return Promise.resolve();
  }

  /**
   * TODO review if exposed?
   * Add a set of filters to the layer, resetting the previpu
   *
   * @param {ColumnFilters} filters
   * @returns
   * @memberof Layer
   */
  public async setFilters(filters: ColumnFilters) {
    this.filtersCollection.clear();
    this.filtersCollection.addFilter(uuidv4(), filters);
    this.emit(LayerEvent.FILTER_CHANGE);

    if (this._deckLayer) {
      return this.replaceDeckLayer();
    }

    return Promise.resolve();
  }

  // TODO not public ?
  addAggregationOptions(columns: AggregatedColumn[] = [], dimensions: string[] = []) {
    dimensions.forEach(dimension => this._source.addField(dimension));
    columns.forEach(aggregatedColumn => this._source.addAggregatedColumn(aggregatedColumn));

    if (this._source.needsInitialization) {
      this.replaceDeckLayer();
    }
  }

  // TODO not public ?
  addSourceField(field: string) {
    this._source.addField(field);

    if (this._source.needsInitialization) {
      this.replaceDeckLayer();
    }
  }

  /**
   * Retrieve the data from the style required to build a legend
   *
   * @param {LegendWidgetOptions} [options={ config: {} }]
   * @returns {(Promise<LegendProperties[] | undefined>)}
   * @memberof Layer
   */
  public async getLegendData(
    options: LegendWidgetOptions = { config: {} }
  ): Promise<LegendProperties[] | undefined> {
    const legendProps = await this._style.getLegendProps(this, options);
    return legendProps;
  }

  /**
   * Get the features visible on the viewport, with optional exclusion filters
   *
   * @param {string[]} [excludedFilters=[]]
   * @returns {Promise<Record<string, unknown>[]>} an array of records ('features'), with properties and values
   * @memberof Layer
   */
  public async getViewportFeatures(
    excludedFilters: string[] = []
  ): Promise<Record<string, unknown>[]> {
    if (!this._viewportFeaturesGenerator.isReady()) {
      throw new CartoError({
        type: 'Layer',
        message:
          'Cannot retrieve viewport features because this layer has not been added to a map yet'
      });
    }

    const isQueueEmpty = this._viewportFeaturesQueue.isQueueEmpty();
    const pendingPromise = this._viewportFeaturesQueue.enqueue();

    if (isQueueEmpty) {
      this._viewportFeaturesGenerator.getFeatures().then(f => {
        let features = f;
        const filters = this.filtersCollection.getApplicatorInstance(excludedFilters);

        if (this.filtersCollection.hasFilters()) {
          features = features.filter(feature => filters.applicator(feature));
        }

        this._viewportFeaturesQueue.resolveQueue(features);
      });
    }

    return (await pendingPromise.catch(error => console.debug(error))) || [];
  }

  /**
   * TODO: REVIEW (private?)
   *
   * Get the whole set of features, with optional exclusion filters.
   * For a tiled source (eg. SQLSource) that's not feasible, so just its viewportFeatures are returned
   *
   * @param {string[]} [excludedFilters=[]]
   * @returns {Promise<Record<string, unknown>[]>}
   * @memberof Layer
   */
  public async getFeatures(excludedFilters: string[] = []): Promise<Record<string, unknown>[]> {
    if (this._source instanceof SQLSource) {
      return this.getViewportFeatures(excludedFilters);
    }

    return this._source.getFeatures(excludedFilters);
  }

  // #endregion

  // #region Private methods

  /**
   * Create the deckgl layer, considering the source and type of visualization required
   */
  private async _createDeckLayer(): Promise<any> {
    this._addStyleFields();

    // The first step is to initialize the source to get the geometryType and the stats
    await this._source.init();

    const layerProperties = await this._getLayerProps();

    // Create the Deck.gl instance
    if (
      this._source.sourceType === 'SQL' ||
      this._source.sourceType === 'Dataset' ||
      this._source.sourceType === 'BQ'
    ) {
      this._deckLayer = new MVTLayer(layerProperties);
    } else if (this._source.sourceType === 'GeoJSON') {
      if (layerProperties._isIconLayer) {
        this._deckLayer = new IconLayer(layerProperties);
      } else {
        this._deckLayer = new GeoJsonLayer(layerProperties);
      }
    } else if (this._source.sourceType === 'DO') {
      this._deckLayer = new DOLayer(layerProperties);
    } else {
      throw new CartoLayerError('Unsupported source instance', layerErrorTypes.UNKNOWN_SOURCE);
    }

    return this._deckLayer;
  }

  /**
   * Get the props to build a deck layer
   */
  private async _getLayerProps(): Promise<any> {
    const props = this._source.getProps();
    const styleProps = await (await this.getStyle()).getLayerProps(this);
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

        this._sendDataEvent('onViewportLoad');
      },
      onClick: this._interactivity.onClick.bind(this._interactivity),
      onHover: this._interactivity.onHover.bind(this._interactivity)
    };

    const visibility = { visible: this._visible };

    const layerProps = {
      ...this._options,
      ...props,
      ...styleProps,
      ...events,
      ...visibility,
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
   * Create a LayerInteractivity helper to deal with styles and events
   */
  private _buildInteractivityHelper(options: Partial<LayerOptions> = {}) {
    let hoverStyle;

    if (options.hoverStyle) {
      hoverStyle =
        typeof options.hoverStyle === 'string'
          ? options.hoverStyle
          : this._buildStyle(options.hoverStyle as Style | StyleProperties);
    }

    let clickStyle;

    if (options.clickStyle) {
      clickStyle =
        typeof options.clickStyle === 'string'
          ? options.clickStyle
          : this._buildStyle(options.clickStyle as Style | StyleProperties);
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

  /**
   * Add style fields to the source
   */
  private _addStyleFields() {
    if (this._style && this._style.field) {
      this._source.addField(this._style.field);
    }
  }

  /**
   * Add popup fields to the source
   */
  private _addPopupFields(elements: PopupElement[] | string[] | null = []) {
    if (elements) {
      elements.forEach((e: PopupElement | string) => {
        const field = typeof e === 'string' ? e : e.attr;
        this._source.addField(field);
      });
    }
  }

  /**
   * Change the data state, if required, including the viewport for viewportFeatures
   */
  private _saveDataState(isChanging: boolean, viewState: ViewState) {
    if (isChanging) {
      this.dataState = DATA_STATES.UPDATING;

      const isGeoJsonLayer = this._source.sourceType === 'GeoJSON';

      if (isGeoJsonLayer) {
        const viewport = new WebMercatorViewport(viewState);
        this._viewportFeaturesGenerator.setViewport(viewport);
      }
    }
  }

  /**
   * Manage data state and asociated events
   */
  private _sendDataEvent(referer: 'onViewportLoad' | 'onAfterRender') {
    const isGeoJsonLayer = this._source.sourceType === 'GeoJSON';

    if (
      this.dataState === DATA_STATES.STARTING &&
      (isGeoJsonLayer || referer === 'onViewportLoad')
    ) {
      this.emit(LayerEvent.DATA_READY);
      this._emitDataChanged();
      this.dataState = DATA_STATES.READY;
    }

    if (this.dataState === DATA_STATES.UPDATING || referer === 'onViewportLoad') {
      this._emitDataChanged();
      this.dataState = DATA_STATES.READY;
    }
  }

  /**
   * We emit DATA_CHANGED event using a debounce function
   * because _sendDataEvent is called a lot of time by
   * onAfterRender and onViewportLoad events
   */
  private _emitDataChanged() {
    this._viewportFeaturesQueue.clearQueue();
    debounce(
      () => this.emit(LayerEvent.DATA_CHANGED),
      OPTION_DEBOUNCE_DELAY,
      this.setOptionScope
    )();
  }

  /**
   * Build a new style
   */
  private _buildStyle(style: Style | StyleProperties) {
    const builtStyle = style instanceof Style ? style : new Style(style);

    if (builtStyle.viewport) {
      this.on(LayerEvent.DATA_CHANGED, async () => this.replaceDeckLayer());
    }

    return builtStyle;
  }

  // #endregion
}

// #region Private complements

enum DATA_STATES {
  STARTING,
  READY,
  UPDATING
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addInTheRightPosition(deckglLayer: any, layers: any[], opts: LayerPosition = {}) {
  const { overLayerId, underLayerId } = opts;

  if (overLayerId && underLayerId) {
    throw new CartoLayerError(
      'Cannot use overLayerId and underLayerId at the same time',
      layerErrorTypes.DEFAULT
    );
  }

  const baseLayerId = overLayerId || underLayerId;

  if (baseLayerId) {
    const layerIdx = layers.findIndex(l => l.id === baseLayerId);

    const baseLayerFound = layerIdx !== -1;

    if (baseLayerFound) {
      if (overLayerId) {
        layers.splice(layerIdx + 1, 0, deckglLayer); // higher index = nearer the top
      } else if (underLayerId) {
        layers.splice(layerIdx, 0, deckglLayer); // lower index = nearer the bottom
      }
    } else {
      layers.push(deckglLayer); // place latest layer on top by default
    }
  } else {
    layers.push(deckglLayer);
  }
}

interface LayerPosition {
  overLayerId?: string;
  underLayerId?: string;
}

const OPTION_DEBOUNCE_DELAY = 500;

// #endregion Complement
