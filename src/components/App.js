import React from "react";
import Client from "../bidi-client/client.js";
import ConnectionContainer from "./ConnectionContainer";
import Console from "./Console";
import { formatConsoleOutput } from "../format-utils/index.js";
import BrowsingContextPicker from "./BrowsingContextPicker.js";

import "./App.css";

const MESSAGE_TYPE = {
  LOG: "log",
  DIR: "dir",
  TABLE: "table",
  TRACE: "trace",
  CLEAR: "clear",
  START_GROUP: "startGroup",
  START_GROUP_COLLAPSED: "startGroupCollapsed",
  END_GROUP: "endGroup",
  CONTENT_BLOCKING_GROUP: "contentBlockingWarningGroup",
  STORAGE_ISOLATION_GROUP: "storageIsolationWarningGroup",
  TRACKING_PROTECTION_GROUP: "trackingProtectionWarningGroup",
  COOKIE_SAMESITE_GROUP: "cookieSameSiteGroup",
  CORS_GROUP: "CORSWarningGroup",
  CSP_GROUP: "CSPWarningGroup",
  ASSERT: "assert",
  DEBUG: "debug",
  PROFILE: "profile",
  PROFILE_END: "profileEnd",
  // Undocumented in Chrome RDP, but is used for evaluation results.
  RESULT: "result",
  // Undocumented in Chrome RDP, but is used for input.
  COMMAND: "command",
  // Undocumented in Chrome RDP, but is used for messages that should not
  // output anything (e.g. `console.time()` calls).
  NULL_MESSAGE: "nullMessage",
  NAVIGATION_MARKER: "navigationMarker",
  SIMPLE_TABLE: "simpleTable",
};
const MESSAGE_LEVEL = {
  LOG: "log",
  ERROR: "error",
  WARN: "warn",
  DEBUG: "debug",
  INFO: "info",
};

class App extends React.Component {
  #client;
  #isReconnecting;

  constructor(props) {
    super(props);

    this.state = {
      browsingContexts: [],
      consoleInput: "",
      consoleOutput: [],
      isBrowsingContextVisible: false,
      isClientReady: false,
      isConnectButtonDisabled: false,
      isConnectingToExistingSession: false,
      host: "localhost:9222",
      selectedBrowsingContextId: null,
      selectedBrowsingContextUrl: null,
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

  #onWebsocketMessage = async (_, data) => {
    console.log({ data });
    // eslint-disable-next-line default-case
    switch (data.method) {
      case "log.entryAdded": {
        const context = this.#findBrowsingContextById(
          this.state.browsingContexts,
          data.params.source.context
        );
        this.setState((state) => ({
          consoleOutput: [
            ...state.consoleOutput,
            {
              contextId: data.params.source.context,
              contextUrl: context?.url ?? "",
              id: data.params.timestamp,
              message: data.params.text,
              source:
                data.params.type === "console"
                  ? "console-api"
                  : data.params.type,
              type: data.params.method,
              level: data.params.level,
              method: data.params.method,
            },
          ],
        }));
        break;
      }
      case "browsingContext.contextCreated":
      case "browsingContext.load": {
        const contextList = await this.#requestBrowsingContexts();
        const selectedContext = this.#findBrowsingContextById(
          contextList,
          this.state.selectedBrowsingContextId
        );
        this.setState({
          browsingContexts: contextList,
          selectedBrowsingContextUrl: selectedContext.url,
        });
        break;
      }
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
      events: [
        "browsingContext.contextCreated",
        "browsingContext.load",
        "log.entryAdded",
      ],
    });

    const contextList = await this.#requestBrowsingContexts();
    const topContext = contextList[0];
    this.setState({
      browsingContexts: contextList,
      selectedBrowsingContextId: topContext.context,
      selectedBrowsingContextUrl: topContext.url,
      isClientReady: true,
    });
  };

  #onClearButtonClick = () => {
    this.setState(() => ({
      consoleOutput: [],
    }));
  };

  #requestBrowsingContexts = async () => {
    const responce = await this.#client.sendCommand(
      "browsingContext.getTree",
      {}
    );
    return responce.result.contexts;
  };

  #findBrowsingContextById(contexts, id) {
    for (let context of contexts) {
      if (context.context === id) return context;

      if (context.children) {
        let desiredContext = this.#findBrowsingContextById(
          context.children,
          id
        );
        if (desiredContext) return desiredContext;
      }
    }
    return false;
  }

  closeBrowsingContextPicker = () => {
    this.setState({
      isBrowsingContextVisible: false,
    });
  };

  toggleBrowsingContextPicker = async () => {
    this.setState({
      isBrowsingContextVisible: !this.state.isBrowsingContextVisible,
    });
  };

  setSelectedBrowsingContext = (browsingContextId, browsingContextUrl) => {
    this.setState({
      selectedBrowsingContextId: browsingContextId,
      selectedBrowsingContextUrl: browsingContextUrl,
    });
  };

  onConsoleSubmit = async (value) => {
    this.setState((state) => ({
      consoleOutput: [
        ...state.consoleOutput,
        {
          contextId: this.state.selectedBrowsingContextId,
          contextUrl: this.state.selectedBrowsingContextUrl,
          id: Date.now(),
          message: value,
          source: "javascript",
          type: MESSAGE_TYPE.COMMAND,
          level: MESSAGE_LEVEL.LOG,
        },
      ],
    }));

    const responce = await this.#client.sendCommand("script.evaluate", {
      expression: value,
      awaitPromise: false,
      target: {
        context: this.state.selectedBrowsingContextId,
      },
    });

    this.setState((state) => ({
      consoleOutput: [
        ...state.consoleOutput,
        {
          contextId: this.state.selectedBrowsingContextId,
          contextUrl: this.state.selectedBrowsingContextUrl,
          id: responce.id,
          message: responce.result.result
            ? formatConsoleOutput(responce.result.result)
            : responce.result.exceptionDetails.text,
          source: "javascript",
          dataType: responce.result.result
            ? responce.result.result.type
            : "string",
          type: MESSAGE_TYPE.RESULT,
          level: responce.result.result
            ? MESSAGE_LEVEL.LOG
            : MESSAGE_LEVEL.ERROR,
        },
      ],
    }));
  };

  onInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const {
      browsingContexts,
      consoleInput,
      consoleOutput,
      isBrowsingContextVisible,
      isClientReady,
      isConnectButtonDisabled,
      host,
      selectedBrowsingContextId,
      selectedBrowsingContextUrl,
    } = this.state;

    return (
      <>
        <header>
          <h3>BiDi WebConsole Prototype</h3>
          {isClientReady ? (
            <>
              <button
                className="webconsole-evaluation-selector-button devtools-button devtools-dropdown-button"
                onClick={this.toggleBrowsingContextPicker}
                title="Select a browsing context"
              >
                {selectedBrowsingContextUrl}
              </button>
              <BrowsingContextPicker
                close={this.closeBrowsingContextPicker}
                contexts={browsingContexts}
                length={browsingContexts.length}
                selectedId={selectedBrowsingContextId}
                setSelectedContext={this.setSelectedBrowsingContext}
                isVisible={isBrowsingContextVisible}
              />
              <button
                className="btn-clear"
                onClick={this.#onClearButtonClick}
                title="Clear the output"
              />
            </>
          ) : null}
        </header>
        <ConnectionContainer
          isClientReady={isClientReady}
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
          selectedBrowsingContextId={selectedBrowsingContextId}
        />
      </>
    );
  }
}

export default App;
