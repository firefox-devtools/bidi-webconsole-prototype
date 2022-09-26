/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EventEmitter } from "./event-emitter.js";

export class WebSocketClient extends EventEmitter {
  #socket;
  constructor() {
    super();

    this.#socket = null;
  }

  open(url) {
    this.#socket = new WebSocket(url);
    this.#socket.onopen = () => this.emit("open");
    this.#socket.onclose = () => this.emit("close");
    this.#socket.onmessage = (e) => this.emit("message", JSON.parse(e.data));
  }

  sendMessage(message) {
    this.#socket.send(JSON.stringify(message));
  }
}
