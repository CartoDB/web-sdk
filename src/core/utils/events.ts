import { WithEvents } from '@/core/mixins/WithEvents';

/**
 * Returns a promise which will be resolved once the event is triggered on emitter,
 * so you can "wait for the event" to happen.
 *
 * This is a simple way to transform an event handler into a promise.
 * This ain't have a timeout, so beware of locks
 *
 * @param {WithEvents} emitter
 * @param {string} eventType
 * @returns {Promise<any>}
 */
export function waitForEvent(emitter: WithEvents, eventType: string): Promise<any> {
  return new Promise(function (resolve) {
    emitter.on(eventType, resolve);
  });
}

// waitForEventWithTimeout

/**
 * Returns a promise which will be resolved once the event is triggered on emitter,
 * so you can "wait for the event" to happen. It imposes also a timeout. If that is
 * consumed without the event happening, an error is returned
 *
 * @export
 * @param {WithEvents} emitter
 * @param {string} eventType
 * @param {number} [timeOut=10000] 10s by default
 * @returns {Promise<any>}
 */
export function waitForEventWithTimeout(
  emitter: WithEvents,
  eventType: string,
  timeOut = 10000
): Promise<any> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Timeout at waitForEventWithTimeout: ${eventType} did not happen on ${emitter} in ${timeOut} milliseconds`
        )
      );
    }, timeOut);
  });

  return Promise.race([timeoutPromise, waitForEvent(emitter, eventType)]);
}
