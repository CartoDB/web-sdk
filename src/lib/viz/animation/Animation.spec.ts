import { FeatureCollection } from 'geojson';
import { CartoError } from '@/core/errors/CartoError';
import { Animation } from './Animation';
import { Layer } from '../layer';
import { GeoJSONSource } from '../source';

describe('Animation', () => {
  describe('Instantiation', () => {
    it('should create instance with defaults', () => {
      const animationLayer = createLayer();
      spyOn(animationLayer, 'addSourceField');

      const animationColumn = 'timestamp';

      expect(new Animation(animationLayer, { column: animationColumn })).toMatchObject({
        layer: animationLayer,
        column: animationColumn,
        duration: 10,
        fade: 0.15
      });

      expect(animationLayer.addSourceField).toHaveBeenCalledWith(animationColumn);
    });

    it.skip('should throw is column is not present or not numeric', () => {
      const animationLayer = createLayer();
      const animation = new Animation(animationLayer, { column: 'fake_column' });

      expect(async () => {
        await animation.start();
      }).toThrow(
        new CartoError({
          type: 'maltype',
          message: 'asasdasd'
        })
      );
    });
  });

  describe('Animation Progress', () => {
    it('should start animation and emit N animationStep', async () => {
      const animationLayer = createLayer();

      const animationStepHandler = jest.fn();

      const animation = new Animation(animationLayer, { column: 'timestamp' });
      animation.on('animationStep', animationStepHandler);

      await animation.start();
      expect(animationStepHandler).toHaveBeenCalled();
      animation.stop();
    });
  });

  describe('Properties', () => {
    describe('isPlaying', () => {
      it('should return animation state', () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });
        expect(animation.isPlaying).toBe(false);
      });
    });
  });

  describe('Methods', () => {
    describe('play', () => {
      it('should change isAnimationPause to false', () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        expect(animation.isPlaying).toBe(false);
        animation.play();
        expect(animation.isPlaying).toBe(true);
      });
    });

    describe('pause', () => {
      it('should change isAnimationPause to true', async () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });
        await animation.start();

        expect(animation.isPlaying).toBe(true);
        animation.pause();
        expect(animation.isPlaying).toBe(false);
      });
    });

    describe('reset', () => {
      it('should reset animationCurrentValue', async () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        await animation.start();
        animation.pause();

        animation.setProgressPct(0.8);
        let animationProperties = animation.getLayerProperties();
        expect(animationProperties.filterSoftRange[0]).toBe(7200);

        animation.reset();
        animationProperties = animation.getLayerProperties();
        expect(animationProperties.filterSoftRange[0]).toBe(0);
      });
    });

    describe('stop', () => {
      it('should call pause, reset and emit animationEnd', () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        spyOn(animation, 'pause');
        spyOn(animation, 'reset');
        spyOn(animation, 'emit');

        animation.stop();

        expect(animation.pause).toHaveBeenCalled();
        expect(animation.reset).toHaveBeenCalled();
        expect(animation.emit).toHaveBeenCalledWith('animationEnd');
      });
    });

    describe('setCurrent', () => {
      it('should set animation value', async () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });
        await animation.start();
        animation.pause();

        animation.setCurrent(5000);
        const layerProperties = animation.getLayerProperties();

        expect(layerProperties).toMatchObject({ filterSoftRange: [4000, 4015] });
      });

      it('should fail if value is over or below limits', async () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });
        await animation.start();
        animation.pause();

        expect(() => animation.setCurrent(1)).toThrow(
          new CartoError({
            type: '[Animation]',
            message: 'Value should be between 1000 and 10000'
          })
        );
      });
    });

    describe('setProgressPct', () => {
      it('should set animation percentage', async () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });
        await animation.start();
        animation.pause();

        animation.setProgressPct(0.75);
        const layerProperties = animation.getLayerProperties();

        expect(layerProperties.filterSoftRange[0]).toBe(6750);
      });

      it('should fail if percentage is over 1 or below 0', () => {
        const animationLayer = createLayer();
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        expect(() => animation.setProgressPct(1.2)).toThrow(
          new CartoError({
            type: '[Animation]',
            message: 'Value should be between 0 and 1'
          })
        );
      });
    });
  });
});

function createLayer() {
  const source = new GeoJSONSource({} as FeatureCollection);
  spyOn(source, 'getMetadata').and.returnValue({
    stats: [{ name: 'timestamp', type: 'number', min: 1000, max: 10000 }]
  });

  const layer = new Layer(source);
  spyOn(layer, 'isReady').and.returnValue(true);

  return layer;
}
