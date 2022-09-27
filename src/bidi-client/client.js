import { EventEmitter } from "./event-emitter.js";
import { WebSocketClient } from "./websocket-client.js";

class Client extends EventEmitter {
  #reqId;
  #websocketClient;

  constructor() {
    super();
    this.#reqId = 1;

    this.#websocketClient = new WebSocketClient();
    this.#websocketClient.on("close", this.#forwardWebsocketEvent);
    this.#websocketClient.on("open", this.#forwardWebsocketEvent);
    this.#websocketClient.on("message", this.#forwardWebsocketEvent);
  }

  connect(host, sessionId = null) {
    const url = `ws://${host}/session${sessionId ? "/" + sessionId : ""}`;
    this.#websocketClient.open(url);
  }

  async sendCommand(method, params) {
    const id = this.sendMessage({ method, params });
    return new Promise((resolve) => {
      const onWsMessage = (eventName, data) => {
        if (data.id === id) {
          this.off("websocket-message", onWsMessage);
          resolve(data);
        }
      };
      this.on("websocket-message", onWsMessage);
    });
  }

  sendMessage(msg) {
    const id = this.#reqId++;
    msg.id = id;
    this.emit("request-sent", { msg });
    this.#websocketClient.sendMessage(msg);
    return id;
  }

  #forwardWebsocketEvent = (eventName, data) => {
    this.emit(`websocket-${eventName}`, data);
  };
}

export default Client;
