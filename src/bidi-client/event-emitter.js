/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export class EventEmitter {
  #listenersByEventName;

  constructor() {
    this.#listenersByEventName = new Map();
  }

  on(eventName, listener) {
    if (!this.#listenersByEventName.has(eventName)) {
      this.#listenersByEventName.set(eventName, new Set());
    }

    const listeners = this.#listenersByEventName.get(eventName);
    listeners.add(listener);
  }

  off(eventName, listener) {
    if (!this.#listenersByEventName.has(eventName)) {
      return;
    }

    const listeners = this.#listenersByEventName.get(eventName);
    listeners.delete(listener);
  }

  emit(eventName, data) {
    const listeners = this.#listenersByEventName.get(eventName);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      try {
        listener(eventName, data);
      } catch (e) {
        console.log(`Callback for event ${eventName} failed`  , e);
      }
    }
  }
}
