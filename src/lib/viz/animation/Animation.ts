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
  private originalAnimationRange: AnimationRange = { min: Infinity, max: -Infinity };
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
    if (!this.layer.isReady()) {
      this.layer.on('tilesLoaded', () => this.start());
      return;
    }

    await this.layer.addAnimation(this);
    await this.init();
    this.play();
    this.emit('animationStart');
    this.onAnimationFrame();
  }

  public get isPlaying() {
    return !this.isAnimationPaused;
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
    this.emit('animationEnd');
  }

  setCurrent(value: number) {
    if (value > this.originalAnimationRange.max || value < this.originalAnimationRange.min) {
      throw new CartoError({
        type: '[Animation]',
        message: `Value should be between ${this.originalAnimationRange.min} and ${this.originalAnimationRange.max}`
      });
    }

    this.animationCurrentValue = value - this.originalAnimationRange.min;
  }

  setProgressPct(progress: number) {
    if (progress > 1 || progress < 0) {
      throw new CartoError({
        type: '[Animation]',
        message: `Value should be between 0 and 1`
      });
    }

    const progressValue = progress * (this.animationRange.max - this.animationRange.min);
    this.animationCurrentValue = this.animationRange.min + progressValue;
  }

  getLayerProperties() {
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

    return {
      extensions: [new DataFilterExtension({ filterSize: 1 })],
      getFilterValue: (feature: GeoJSON.Feature) => {
        if (!feature) {
          return null;
        }

        return (feature.properties || {})[this.column] - this.originalAnimationRange.min;
      },
      filterRange,
      filterSoftRange
    };
  }

  private async init() {
    const ranges = this.getAnimationRange();
    this.animationRange = ranges.transformedRange;
    this.originalAnimationRange = ranges.originalRange;
    this.animationCurrentValue = this.animationRange.min;

    const animationRange = this.animationRange.max - this.animationRange.min;
    this.animationStep = animationRange / (SCREEN_HZ * this.duration);
    this.animationFadeDuration = this.fade * this.animationStep * SCREEN_HZ;
  }

  private onAnimationFrame() {
    if (this.isAnimationPaused) {
      return;
    }

    if (this.animationCurrentValue > this.animationRange.max) {
      this.reset();
    }

    requestAnimationFrame(() => {
      this.animationCurrentValue += this.animationStep;
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
        message: 'Specified column is not present or does not contain timestamps or dates',
        type: '[Animation]'
      });
    }

    return {
      originalRange: { min: columnStats.min, max: columnStats.max },
      transformedRange: { min: 0, max: columnStats.max - columnStats.min }
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
