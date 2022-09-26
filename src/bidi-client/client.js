import { EventEmitter } from "./event-emitter.js";
import { WebSocketClient } from "./websocket-client.js";

class Client extends EventEmitter {
  #reqId;
  #websocketClient;

  constructor() {
    super();
    this.#reqId = 1;
    this.#websocketClient = new WebSocketClient(this);
  }

  connect(host) {
    this.#websocketClient.open(`ws://${host}/session`);
    this.#websocketClient.on("close", (_, data) =>
      this.emit("websocket-close", data)
    );
    this.#websocketClient.on("open", (_, data) =>
      this.emit("websocket-open", data)
    );
    this.#websocketClient.on("message", (_, data) => {
      this.emit("websocket-message", data);
      console.log("websocketClient", { data });
    });
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
}

export default Client;
