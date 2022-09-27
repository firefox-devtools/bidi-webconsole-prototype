import React from "react";
import Client from "../bidi-client/client.js";
import ConnectionContainer from "./ConnectionContainer";
import Console from "./Console";

import "./App.css";

class App extends React.Component {
  #client;
  #isReconnecting;
  #topBrowsingContextId;

  constructor(props) {
    super(props);

    this.state = {
      consoleInput: "",
      consoleOutput: [],
      isClientReady: false,
      isConnectButtonDisabled: false,
      isConnectingToExistingSession: false,
      host: "localhost:9222",
    };

    this.#client = new Client();
    this.#client.on("websocket-close", this.#onWebsocketClose);
    this.#client.on("websocket-open", this.#onWebsocketOpen);
    this.#client.on("websocket-message", this.#onWebsocketMessage);

    this.#isReconnecting = false;
  }

  componentDidMount() {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      // XXX: ReactStrictMode mounts the components twice. Since this component
      // owns the client, it makes sense to let it drive the reconnection.
      // This dirty workaround avoids attempting two connections at once.
      if (this.#isReconnecting) {
        return false;
      }
      this.#isReconnecting = true;

      console.log("Attempt to reconnect to session id:", sessionId);
      this.setState({
        isConnectingToExistingSession: true,
      });
      this.#client.connect(this.state.host, sessionId);
    }
  }

  connectClient = () => {
    console.log("Attempt to create a connection to a new session");
    this.setState({
      isConnectingToExistingSession: false,
    });
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

    const sessionStatusResponse = await this.#client.sendCommand(
      "session.status",
      {}
    );

    // If we connected to an existing session, status `ready` will be false.
    // Only attempt to create a new session if `ready` is true.
    const canCreateNewSession = sessionStatusResponse.result.ready;
    const { isConnectingToExistingSession } = this.state;
    if (!canCreateNewSession && !isConnectingToExistingSession) {
      console.log(
        "Unable to establish a new connection or to reuse an existing one," +
          " please restart the target Firefox and reconnect"
      );
      return;
    }

    if (canCreateNewSession) {
      console.log("Creating a new session");
      const sessionNewResponse = await this.#client.sendCommand(
        "session.new",
        {}
      );

      // Store the session id
      const sessionId = sessionNewResponse.result.sessionId;
      localStorage.setItem("sessionId", sessionId);
    }

    // XXX: For existing sessions, we already subscribed to this in theory.
    // We could skip it, but we have no way to check if we are already
    // subscribed. We could also unsubscribe/subscribe.
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
