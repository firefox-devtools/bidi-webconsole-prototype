import React from "react";
import "./ConsoleOutput.css";

function transformLevelToClass(level) {
  let className;

  switch (level) {
    case "warning":
      className = "warn";
      break;
    case "info":
      className = "log";
      break;
    default:
      className = level;
  }
  return className || "";
}

class ConsoleOutput extends React.Component {
  constructor(props) {
    super(props);

    this.containerRef = React.createRef();
  }

  scrollToBottom = () => {
    const messages = this.containerRef?.current.childNodes;
    if (messages && messages.length) {
      messages[messages.length - 1].scrollIntoView();
    }
  };

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  render() {
    const { selectedBrowsingContextId, messages } = this.props;
    return (
      <div className="webconsole-output" ref={this.containerRef}>
        {messages.map(
          ({
            contextId,
            contextUrl,
            id,
            level,
            message,
            source,
            type = "",
            dataType = "string",
          }) =>
            selectedBrowsingContextId === contextId ? (
              <div
                className={`message ${source} ${type} ${transformLevelToClass(
                  level
                )}`}
                key={id}
              >
                <span className="icon" />
                <span className="message-body-wrapper">
                  <span className="message-flex-body">
                    <span className="message-body devtools-monospace">
                      <span className={`objectBox objectBox-${dataType}`}>
                        {message}
                      </span>
                    </span>
                    <span className="frame-link message-location devtools-monospace">
                      {contextUrl}
                    </span>
                  </span>
                </span>
              </div>
            ) : null
        )}
      </div>
    );
  }
}

export default ConsoleOutput;
