import "./ConnectionContainer.css";

const ConnectionContainer = ({
  host,
  isClientReady,
  isConnectButtonDisabled,
  onClick,
  onInputChange,
}) => {
  if (isClientReady) {
    return null;
  }

  const connectionArguments = `--remote-debugging-port --remote-allow-origins=${window.location.origin}`;

  return (
    <div id="connection-container">
      <h4>Connect to browser</h4>
      <div id="connection-help">
        <p>
          Start Firefox with{" "}
          <span id="connection-help-arguments">
            {connectionArguments}
          </span>
          <button
          id="copy-to-clipboard"
          onClick={(event) => {
            event.stopPropagation();
            navigator.clipboard.writeText(connectionArguments);

            event.target.textContent = "copied!";
            window.setTimeout(
              () => (event.target.textContent = "copy to clipboard"),
              1000
            );
          }}>
          copy to clipboard
        </button>
        </p>
        <p>or chromium-bidi package</p>
      </div>
      <div>
        <input
          type="text"
          id="host"
          name="host"
          placeholder="hostname:port"
          value={host}
          onChange={onInputChange}
        />{" "}
        <button
          id="connect"
          onClick={onClick}
          disabled={isConnectButtonDisabled}
        >
          connect
        </button>
      </div>
    </div>
  );
};

export default ConnectionContainer;
