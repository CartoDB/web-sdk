import { DataFilterExtension } from '@deck.gl/extensions';
import { CartoError } from '@/core/errors/CartoError';
import { WithEvents } from '@/core/mixins/WithEvents';
import type { Layer } from '../layer/Layer';
import { NumericFieldStats } from '../source';

const SCREEN_HZ = 60;

export class Animation extends WithEvents {
  private layer: Layer;
  private column: string;
  private duration: number;
  private fade: number;

  private isAnimationPaused = true;
  private animationRange: AnimationRange = { min: Infinity, max: -Infinity };
  private animationCurrentValue = 0;
  private animationStep = 0;
  private animationFadeDuration = 0;

  constructor(layer: Layer, options: AnimationOptions) {
    super();

    const {
      column,
      duration = DEFAULT_ANIMATION_OPTIONS.duration,
      fade = DEFAULT_ANIMATION_OPTIONS.fade
    } = options;

    this.layer = layer;
    this.column = column;
    this.duration = duration;
    this.fade = fade;

    this.layer.addSourceField(this.column);
    this.registerAvailableEvents(['animationStart', 'animationEnd', 'animationStep']);
  }

  async start() {
    await this.init();
    this.play();
    this.onAnimationFrame();
  }

  play() {
    this.isAnimationPaused = false;
  }

  pause() {
    this.isAnimationPaused = true;
  }

  reset() {
    this.animationCurrentValue = this.animationRange.min;
  }

  stop() {
    this.pause();
    this.reset();
  }

  setCurrent(value: number) {
    if (value > this.animationRange.max || value < this.animationRange.min) {
      throw new CartoError({
        type: '',
        message: ''
      });
    }

    this.animationCurrentValue = value;
  }

  setProgressPct(progress: number) {
    if (progress > 1 || progress < 0) {
      throw new CartoError({
        type: '',
        message: ''
      });
    }

    const progressValue = progress * (this.animationRange.max - this.animationRange.min);
    this.animationCurrentValue = this.animationRange.min + progressValue;
  }

  getLayerProperties() {
    if (this.animationCurrentValue > this.animationRange.max) {
      this.reset();
    }

    const animationRangeStart = this.animationCurrentValue;
    const animationRangeEnd = Math.min(
      this.animationCurrentValue + this.animationStep,
      this.animationRange.max
    );

    // Range defines timestamp range for
    // visible features (some features may be fading in/out)
    const filterRange = [
      animationRangeStart - this.animationFadeDuration,
      animationRangeEnd + this.animationFadeDuration
    ];

    // Soft Range defines the timestamp range when
    // features are at max opacity and size
    const filterSoftRange = [animationRangeStart, animationRangeEnd];

    const layerProperties = {
      extensions: [new DataFilterExtension({ filterSize: 1 })],
      getFilterValue: (feature: GeoJSON.Feature) => {
        if (!feature) {
          return null;
        }

        return (feature.properties || {})[this.column];
      },
      filterRange,
      filterSoftRange
    };

    this.animationCurrentValue += this.animationStep;
    return layerProperties;
  }

  private async init() {
    this.animationRange = this.getAnimationRange();
    this.animationCurrentValue = this.animationRange.min;

    const animationRange = this.animationRange.max - this.animationRange.min;
    this.animationStep = animationRange / (SCREEN_HZ * this.duration);
    this.animationFadeDuration = this.fade * this.animationStep * SCREEN_HZ;
  }

  private onAnimationFrame() {
    if (this.isAnimationPaused) {
      return;
    }

    requestAnimationFrame(() => {
      this.onAnimationFrame();
    });

    this.emit('animationStep');
  }

  private getAnimationRange() {
    const layerMetadata = this.layer.source.getMetadata();
    const columnStats = layerMetadata.stats.find(
      column => column.name === this.column
    ) as NumericFieldStats;

    if (!columnStats || columnStats.type !== 'number') {
      throw new CartoError({
        message: '',
        type: ''
      });
    }

    return {
      min: columnStats.min,
      max: columnStats.max
    };
  }
}

export interface AnimationOptions {
  column: string;
  duration?: number;
  fade?: number;
}

export interface AnimationRange {
  min: number;
  max: number;
}

const DEFAULT_ANIMATION_OPTIONS = {
  duration: 10,
  fade: 0.15
};
