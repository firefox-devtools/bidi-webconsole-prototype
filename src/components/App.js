import React from "react";
import Client from "../bidi-client/client.js";
import ConnectionContainer from "./ConnectionContainer";
import Console from "./Console";
import { formatConsoleOutput } from "../format-utils/index.js";
import BiDiLog from "./BiDiLog.js";
import BrowsingContextPicker from "./BrowsingContextPicker.js";
import Network from "./Network";
import { findContextById } from "../utils.js";
import Tabs from "./Tabs";

import consoleIcon from "../assets/tool-webconsole.svg";
import networkIcon from "../assets/tool-network.svg";
import bidiLogIcon from "../assets/report.svg";

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

const HAR_EVENTS = [
  "network.beforeRequestSent",
  "network.responseCompleted",
  "browsingContext.domContentLoaded",
  "browsingContext.load",
];

class App extends React.Component {
  #client;
  #evaluationBrowsingContextUrl;
  #isReconnecting;
  #lastMessageId;
  #networkEventsSupported;

  constructor(props) {
    super(props);

    this.state = {
      activeTab: "console",
      browserName: null,
      browserVersion: null,
      browsingContexts: [],
      bidiCommand: "",
      bidiLog: [],
      consoleInput: "",
      consoleOutput: [],
      evaluationBrowsingContextId: null,
      filteringBrowsingContextId: null,
      isClientReady: false,
      isConnectButtonDisabled: false,
      isConnectingToExistingSession: false,
      harEvents: [],
      host: "localhost:9222",
      networkEntries: [],
      pageTimings: [],
    };

    this.#client = new Client(this.updateBidiLog);
    this.#client.on("websocket-close", this.#onWebsocketClose);
    this.#client.on("websocket-open", this.#onWebsocketOpen);
    this.#client.on("websocket-message", this.#onWebsocketMessage);

    this.#isReconnecting = false;
    this.#networkEventsSupported = true;
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

  #getNewMessageId() {
    const newId = (this.#lastMessageId || 0) + 1;
    this.#lastMessageId = newId;
    return newId;
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
    if (HAR_EVENTS.includes(data.method)) {
      this.state.harEvents.push(data);
    }

    // eslint-disable-next-line default-case
    switch (data.method) {
      case "log.entryAdded": {
        const context = findContextById(
          this.state.browsingContexts,
          data.params.source?.context
        );
        this.setState((state) => ({
          consoleOutput: [
            ...state.consoleOutput,
            {
              contextId: data.params.source?.context,
              contextUrl: context?.url ?? "",
              id: this.#getNewMessageId(),
              message: data.params.text,
              source:
                data.params.type === "console"
                  ? "console-api"
                  : data.params.type,
              timestamp: data.params.timestamp,
              type: data.params.method,
              level: data.params.level,
              method: data.params.method,
            },
          ],
        }));
        break;
      }
      case "browsingContext.contextCreated": {
        await this.#updateBrowsingContexts();
        break;
      }
      case "browsingContext.domContentLoaded": {
        this.#updatePageTimings("domContentLoaded", data.params);
        break;
      }
      case "browsingContext.load": {
        this.#updatePageTimings("load", data.params);
        await this.#updateBrowsingContexts();
        break;
      }
      case "network.beforeRequestSent": {
        this.setState((state) => ({
          networkEntries: [
            ...state.networkEntries,
            {
              contextId: data.params.context,
              id: data.params.request.request + data.params.redirectCount,
              url: data.params.request.url,
              redirectCount: data.params.redirectCount,
              request: data.params.request,
            },
          ],
        }));
        break;
      }
      case "network.responseCompleted": {
        this.setState((state) => {
          const entry = state.networkEntries.find(
            (e) =>
              e.request.request === data.params.request.request &&
              e.redirectCount === data.params.redirectCount
          );
          entry.request = data.params.request;
          entry.response = data.params.response;
          return {
            networkEntries: [...state.networkEntries],
          };
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

    // For Firefox if we connected to an existing session, status `ready` will be false.
    // Only attempt to create a new session if `ready` is true.
    // For Chrome we can not send "session.status" command before starting the session,
    // so the `result` property is going to be `undefined`.
    const canCreateNewSession = sessionStatusResponse.result
      ? sessionStatusResponse.result.ready
      : true;
    // const { isConnectingToExistingSession } = this.state;
    // if (!canCreateNewSession && !isConnectingToExistingSession) {
    //   console.log(
    //     "Unable to establish a new connection or to reuse an existing one," +
    //       " please restart the target Firefox and reconnect"
    //   );
    //   return;
    // }

    if (canCreateNewSession) {
      console.log("Creating a new session");
      const sessionNewResponse = await this.#client.sendCommand("session.new", {
        capabilities: {},
      });

      // Store the session id
      const { capabilities, sessionId } = sessionNewResponse.result;
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("browserName", capabilities.browserName);
      localStorage.setItem("browserVersion", capabilities.browserVersion);
    }

    // XXX: For existing sessions, we already subscribed to this in theory.
    // We could skip it, but we have no way to check if we are already
    // subscribed. We could also unsubscribe/subscribe.
    const response = await this.#client.sendCommand("session.subscribe", {
      events: [
        "browsingContext.contextCreated",
        "browsingContext.domContentLoaded",
        "browsingContext.load",
        "log.entryAdded",
        "network.beforeRequestSent",
        "network.responseCompleted",
      ],
    });
    // Chrome doesn't support network events yet, that's why previous subscribe
    // will fail, and, in this case, we will subscribe again excluding network events.
    if (response.error === "invalid argument") {
      this.#networkEventsSupported = false;
      this.#client.sendCommand("session.subscribe", {
        events: [
          "browsingContext.contextCreated",
          "browsingContext.domContentLoaded",
          "browsingContext.load",
          "log.entryAdded",
        ],
      });
    }

    const contextList = await this.#requestBrowsingContexts();
    const topContext = contextList[0];
    this.#evaluationBrowsingContextUrl = topContext.url;
    this.setState({
      browserName: localStorage.getItem("browserName"),
      browserVersion: localStorage.getItem("browserVersion"),
      browsingContexts: contextList,
      evaluationBrowsingContextId: topContext.context,
      isClientReady: true,
    });
  };

  // Clear the log depending on the selected tab
  #onClearButtonClick = () => {
    if (this.state.activeTab === "console") {
      this.setState(() => ({
        consoleOutput: [],
      }));
    } else if (this.state.activeTab === "network") {
      this.setState(() => ({
        harEvents: [],
        networkEntries: [],
        pageTimings: [],
      }));
    } else {
      this.setState(() => ({
        bidiLog: [],
      }));
    }
  };

  #requestBrowsingContexts = async () => {
    const responce = await this.#client.sendCommand(
      "browsingContext.getTree",
      {}
    );
    return responce.result.contexts;
  };

  #updateBrowsingContexts = async () => {
    const contextList = await this.#requestBrowsingContexts();
    const selectedContext = findContextById(
      contextList,
      this.state.evaluationBrowsingContextId
    );
    this.#evaluationBrowsingContextUrl = selectedContext.url;
    this.setState({
      browsingContexts: contextList,
    });
  };

  #updatePageTimings = async (type, eventParams) => {
    const { context, timestamp, url } = eventParams;
    this.setState((state) => {
      const firstRequest = state.networkEntries.findLast(
        (entry) => entry.contextId === context && entry.request.url === url
      );

      let relativeTime = +Infinity,
        startedTime = -1;
      if (firstRequest) {
        const timings = firstRequest.request.timings;
        startedTime = timings.requestTime / 1000;
        relativeTime = timestamp - startedTime;
        relativeTime = relativeTime.toFixed(1);
        firstRequest.isFirstRequest = true;
      }

      return {
        pageTimings: [
          ...state.pageTimings,
          {
            contextId: context,
            relativeTime,
            startedTime,
            timestamp,
            type,
            url,
          },
        ],
      };
    });
  };

  sendCommand = (e) => {
    e.preventDefault();
    try {
      const commandObject = JSON.parse(this.state.bidiCommand);
      this.#client.sendCommand(commandObject.method, commandObject.params);
    } catch (e) {
      console.log({ e });
    }
  };

  setActiveTab = (tab) => {
    this.setState({
      activeTab: tab,
    });
  };

  setEvaluationBrowsingContext = (browsingContextId, browsingContextUrl) => {
    this.#evaluationBrowsingContextUrl = browsingContextUrl;
    this.setState({
      evaluationBrowsingContextId: browsingContextId,
    });
  };

  setFilteringBrowsingContext = (browsingContextId) => {
    this.setState({
      filteringBrowsingContextId: browsingContextId,
    });
  };

  onConsoleSubmit = async (value) => {
    this.setState((state) => ({
      consoleOutput: [
        ...state.consoleOutput,
        {
          contextId: this.state.evaluationBrowsingContextId,
          contextUrl: this.#evaluationBrowsingContextUrl,
          id: this.#getNewMessageId(),
          message: value,
          source: "javascript",
          timestamp: Date.now(),
          type: MESSAGE_TYPE.COMMAND,
          level: MESSAGE_LEVEL.LOG,
        },
      ],
    }));

    const responce = await this.#client.sendCommand("script.evaluate", {
      expression: value,
      awaitPromise: false,
      target: {
        context: this.state.evaluationBrowsingContextId,
      },
    });

    this.setState((state) => ({
      consoleOutput: [
        ...state.consoleOutput,
        {
          contextId: this.state.evaluationBrowsingContextId,
          contextUrl: this.#evaluationBrowsingContextUrl,
          id: this.#getNewMessageId(),
          message: responce.result
            ? responce.result.result
              ? formatConsoleOutput(responce.result.result)
              : responce.result.exceptionDetails.text
            : responce.message,
          source: "javascript",
          dataType: responce.result?.result
            ? responce.result.result.type
            : "string",
          timestamp: Date.now(),
          type: MESSAGE_TYPE.RESULT,
          level: responce.result?.result
            ? MESSAGE_LEVEL.LOG
            : MESSAGE_LEVEL.ERROR,
        },
      ],
    }));
  };

  onInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  updateBidiLog = (entry) => {
    this.setState((state) => ({
      bidiLog: [...state.bidiLog, entry],
    }));
  };

  render() {
    const {
      activeTab,
      bidiCommand,
      bidiLog,
      browserName,
      browserVersion,
      browsingContexts,
      consoleInput,
      consoleOutput,
      evaluationBrowsingContextId,
      filteringBrowsingContextId,
      harEvents,
      host,
      isClientReady,
      isConnectButtonDisabled,
      networkEntries,
      pageTimings,
    } = this.state;

    const tabs = [
      {
        id: "console",
        icon: consoleIcon,
        title: "Console",
        content: (
          <Console
            consoleOutput={consoleOutput}
            consoleInput={consoleInput}
            isClientReady={isClientReady}
            onSubmit={this.onConsoleSubmit}
            onChange={this.onInputChange}
            evaluationBrowsingContextId={evaluationBrowsingContextId}
            filteringBrowsingContextId={filteringBrowsingContextId}
            browsingContexts={browsingContexts}
            setEvaluationBrowsingContext={this.setEvaluationBrowsingContext}
          />
        ),
      },
    ];

    // Add network tab only if network events are supported.
    if (this.#networkEventsSupported) {
      tabs.push({
        id: "network",
        icon: networkIcon,
        title: "Network",
        content: (
          <Network
            browserName={browserName}
            browserVersion={browserVersion}
            filteringBrowsingContextId={filteringBrowsingContextId}
            isClientReady={isClientReady}
            harEvents={harEvents}
            networkEntries={networkEntries}
            pageTimings={pageTimings}
          />
        ),
      });
    }

    tabs.push({
      id: "bidi-log",
      icon: bidiLogIcon,
      title: "BiDi interface",
      content: (
        <BiDiLog
          log={bidiLog}
          bidiCommand={bidiCommand}
          onBidiCommandChange={this.onInputChange}
          sendCommand={this.sendCommand}
        />
      ),
    });

    return (
      <>
        <header>
          <h3>BiDi WebConsole Prototype</h3>
          {isClientReady ? (
            <>
              <BrowsingContextPicker
                buttonTitle="Select a browsing context to filter console messages"
                contexts={[
                  {
                    context: null,
                    url: "Top context",
                    children: [],
                  },
                  ...browsingContexts,
                ]}
                selectedId={filteringBrowsingContextId}
                setSelectedBrowsingContext={this.setFilteringBrowsingContext}
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
        {isClientReady ? (
          <Tabs
            activeTab={activeTab}
            setActiveTab={this.setActiveTab}
            tabs={tabs}
          />
        ) : null}
      </>
    );
  }
}

export default App;
