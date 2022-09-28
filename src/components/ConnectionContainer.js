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

  return (
    <div id="connection-container">
      <h4>Connect to Firefox</h4>
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
      <div id="connection-help">
        Start Firefox with{" "}
        <span id="connection-help-arguments">
          --remote-debugging-port --remote-allow-origins=
          {window.location.origin}
        </span>
      </div>
    </div>
  );
};

export default ConnectionContainer;
