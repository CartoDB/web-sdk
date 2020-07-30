import { Animation } from './Animation';
import { Layer } from '../layer';

describe.skip('Animation', () => {
  describe('Instantiation', () => {
    it('should create instance with defaults', () => {
      const animationLayer = new Layer('fake_source');
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
  });

  describe('Animation Progress', () => {
    it.skip('should start animation and emit N animationStep', async () => {
      const animationLayer = new Layer('fake_source');

      const animationStepHandler = jest.fn();

      const animation = new Animation(animationLayer, { column: 'timestamp' });
      animation.on('animationStep', animationStepHandler);

      await animation.start();

      expect(animationStepHandler).toHaveBeenCalledTimes(10);
    });
  });

  describe('Methods', () => {
    describe('play', () => {
      it('should change isAnimationPause to false', () => {
        const animationLayer = new Layer('fake_source');
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        expect(animation.isPlaying).toBe(false);
        animation.play();
        expect(animation.isPlaying).toBe(true);
      });
    });

    describe('pause', () => {
      it('should change isAnimationPause to true', () => {
        const animationLayer = new Layer('fake_source');
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        expect(animation.isPlaying).toBe(true);
        animation.play();
        expect(animation.isPlaying).toBe(false);
      });
    });

    describe('reset', () => {
      it('should reset animationCurrentValue', () => {
        const animationLayer = new Layer('fake_source');
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        animation.setProgressPct(0.8);
        let animationProperties = animation.getLayerProperties();
        expect(animationProperties.filterRange[0]).toBe(0);

        animation.reset();
        animationProperties = animation.getLayerProperties();
        expect(animationProperties);
      });
    });

    describe('stop', () => {
      it('should call pause, reset and emit animationEnd', () => {
        const animationLayer = new Layer('fake_source');
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
      it('should set animation value', () => {
        const animationLayer = new Layer('fake_source');
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        animation.setCurrent(10);
        const layerProperties = animation.getLayerProperties();

        expect(layerProperties).toMatchObject({ filterSoftRange: [] });
      });
    });

    describe('setProgressPct', () => {
      it('should set animation value', () => {
        const animationLayer = new Layer('fake_source');
        const animation = new Animation(animationLayer, { column: 'timestamp' });

        animation.setProgressPct(0.75);
        const layerProperties = animation.getLayerProperties();

        expect(layerProperties).toMatchObject({ filterSoftRange: [] });
      });
    });
  });
});
