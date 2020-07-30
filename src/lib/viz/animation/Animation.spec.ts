import { Animation } from './Animation';
import { Layer } from '../layer';

describe('Animation', () => {
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
});
