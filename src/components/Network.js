import "./Network.css";

const Network = ({
  networkEntries,
  isClientReady,
  filteringBrowsingContextId,
}) => {
  if (!isClientReady) {
    return null;
  }

  return (
    <div className="network-app">
      <div className="network-header">
        <div className="network-row">
          <span className="network-column network-column-status ellipsis-text">
            Status
          </span>
          <span className="network-column network-column-method ellipsis-text">
            Method
          </span>
          <span className="network-column network-column-protocol ellipsis-text">
            Protocol
          </span>
          <span className="network-column network-column-url">
            URL
          </span>
        </div>
      </div>
      <div className="network-entries">
        {networkEntries.map(
          ({
            contextId,
            url,
            request,
            response,
          }) =>
            !filteringBrowsingContextId || (filteringBrowsingContextId === contextId) ? (
              <div className="network-row">
                <span className="network-column network-column-status">
                  {response?.status}
                </span>
                <span className="network-column network-column-status">
                  {request.method}
                </span>
                <span className="network-column network-column-status">
                  {response?.protocol}
                </span>
                <span className="network-column network-column-status ellipsis-text">
                  {request.url}
                </span>
              </div>
            ) : null
        )}
      </div>
    </div>
  );
};

export default Network;
