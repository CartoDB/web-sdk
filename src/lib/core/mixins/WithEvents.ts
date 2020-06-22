import mitt from 'mitt';
import { CartoError } from '../errors/CartoError';

export abstract class WithEvents {
  protected emitter = mitt();
  protected _availableEvents = ['*'];

  protected registerAvailableEvents(eventArray: string[]) {
    this._availableEvents = ['*', ...eventArray];
  }

  public emit(type: string, event?: unknown) {
    if (!this.availableEvents.includes(type)) {
      throw new CartoError({
        type: '[Events]',
        message: `Trying to emit an unknown event type: ${type}. Available events: ${this.availableEvents.join(
          ', '
        )}.`
      });
    }

    this.emitter.emit(type, event);
  }

  on(type: string, handler: mitt.Handler) {
    if (!this.availableEvents.includes(type)) {
      this.throwEventNotFoundError(type);
    }

    this.emitter.on(type, handler);
  }

  off(type: string, handler: mitt.Handler) {
    if (!this.availableEvents.includes(type)) {
      this.throwEventNotFoundError(type);
    }

    this.emitter.off(type, handler);
  }

  public get availableEvents() {
    return [...this._availableEvents];
  }

  private throwEventNotFoundError(eventType: string) {
    throw new CartoError({
      type: '[Events]',
      message: `Trying to listen an unknown event type: ${eventType}. Available events: ${this.availableEvents.join(
        ', '
      )}.`
    });
  }
}
