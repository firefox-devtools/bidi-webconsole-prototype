import { EventEmitter } from "./event-emitter.js";
import { WebSocketClient } from "./websocket-client.js";

class Client extends EventEmitter {
  #reqId;
  #updateLog;
  #websocketClient;

  constructor(updateLog) {
    super();
    this.#reqId = 1;

    this.#websocketClient = new WebSocketClient();
    this.#websocketClient.on("close", (eventName, data) => {
      this.#updateLog({ message: "WebSocket closed", type: "ws" });
      this.#forwardWebsocketEvent(eventName, data);
    });
    this.#websocketClient.on("open", (eventName, data) => {
      this.#updateLog({ message: "WebSocket open", type: "ws" });
      this.#forwardWebsocketEvent(eventName, data);
    });
    this.#websocketClient.on("message", (eventName, data) => {
      this.#updateLog({
        message: JSON.stringify(data),
        type: data.id ? "response" : "event",
      });
      this.#forwardWebsocketEvent(eventName, data);
    });

    this.#updateLog = updateLog;
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
    this.#updateLog({
      message: JSON.stringify(msg),
      type: "request",
    });
    return id;
  }

  #forwardWebsocketEvent = (eventName, data) => {
    this.emit(`websocket-${eventName}`, data);
  };
}

export default Client;
