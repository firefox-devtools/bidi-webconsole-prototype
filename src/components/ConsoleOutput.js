import "./ConsoleOutput.css";

const ConsoleOutput = ({ messages }) => {
  return (
    <div className="webconsole-output">
      {messages.map(({ id, level, message, type }) => (
        <div
          className={`message javascript ${type} ${
            level === "warning" ? "warn" : level || ""
          }`}
          key={id}
        >
          <span className="icon" />
          <span className="message-body-wrapper">
            <span className="message-flex-body">
              <span className="message-body devtools-monospace">
                <span className="objectBox objectBox-string">{message}</span>
              </span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ConsoleOutput;
