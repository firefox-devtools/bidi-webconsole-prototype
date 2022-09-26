import React from "react";
import Client from "../bidi-client/client.js";
import ConnectionContainer from "./ConnectionContainer";
import Console from "./Console";

import "./App.css";

class App extends React.Component {
  #client;
  #topBrowsingContextId;

  constructor(props) {
    super(props);

    this.state = {
      consoleInput: "",
      consoleOutput: [],
      isClientReady: false,
      isConnectButtonDisabled: false,
      host: "localhost:9222",
    };

    this.#client = new Client();
  }

  connectClient = () => {
    this.#client.on("websocket-close", this.#onWebsocketClose);
    this.#client.on("websocket-open", this.#onWebsocketOpen);
    this.#client.on("websocket-message", this.#onWebsocketMessage);

    this.#client.connect(this.state.host);
  };

  #onWebsocketClose = () => {
    this.setState({
      isClientReady: false,
      isConnectButtonDisabled: false,
    });
  };

  #onWebsocketMessage = (_, data) => {
    console.log({ data });
    // Track only log.entryAdded event
    if (data.method === "log.entryAdded") {
      // Extend to support not only log messages
      this.setState({
        consoleOutput: [
          ...this.state.consoleOutput,
          {
            id: data.params.timestamp,
            message: data.params.args[0].value,
          },
        ],
      });
    }
  };

  #onWebsocketOpen = async () => {
    this.setState({
      isConnectButtonDisabled: true,
    });

    await this.#client.sendCommand("session.new", {});

    this.#client.sendCommand("session.subscribe", {
      events: ["log.entryAdded"],
    });

    const responce = await this.#client.sendCommand(
      "browsingContext.getTree",
      {}
    );
    this.#topBrowsingContextId = responce.result.contexts[0].context;
    this.setState({
      isClientReady: true,
    });
  };

  onConsoleSubmit = async (event) => {
    event.preventDefault();
    const responce = await this.#client.sendCommand("script.evaluate", {
      expression: this.state.consoleInput,
      awaitPromise: false,
      target: {
        context: this.#topBrowsingContextId,
      },
    });

    this.setState({
      consoleOutput: [
        ...this.state.consoleOutput,
        {
          id: responce.id,
          message: responce.result.result
            ? responce.result.result.value
            : responce.result.exceptionDetails.text,
        },
      ],
    });
  };

  onInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const {
      consoleInput,
      consoleOutput,
      isClientReady,
      isConnectButtonDisabled,
      host,
    } = this.state;
    return (
      <div>
        <h3>BiDi WebConsole Prototype</h3>
        <div className="wrapper">
          <ConnectionContainer
            isConnectButtonDisabled={isConnectButtonDisabled}
            host={host}
            onClick={this.connectClient}
            onInputChange={this.onInputChange}
          />
          <Console
            consoleOutput={consoleOutput}
            consoleInput={consoleInput}
            isClientReady={isClientReady}
            onSubmit={this.onConsoleSubmit}
            onChange={this.onInputChange}
          />
        </div>
      </div>
    );
  }
}

export default App;
