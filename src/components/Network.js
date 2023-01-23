import "./Network.css";

const Network = ({
  filteringBrowsingContextId,
  isClientReady,
  networkEntries,
  pageTimings,
}) => {
  if (!isClientReady) {
    return null;
  }

  const entries = networkEntries.filter(({ contextId }) =>
            !filteringBrowsingContextId || (filteringBrowsingContextId === contextId));

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
        {entries.map(
          ({
            isFirstRequest,
            request,
            response,
            url,
          }) =>
            <div className={`network-row ${isFirstRequest ? 'network-first-request' : ''}`}>
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
        )}
      </div>
      <div className="network-footer">
        <span className="network-summary-item">
          {entries.length} requests
        </span>
        <span className="network-summary-item network-summary-timing">
          DOMContentLoaded: {pageTimings.findLast(t => t.type === "domContentLoaded")?.relativeTime}ms
        </span>
        <span className="network-summary-item network-summary-timing">
          load: {pageTimings.findLast(t => t.type === "load")?.relativeTime}ms
        </span>
      </div>
    </div>
  );
};

export default Network;
