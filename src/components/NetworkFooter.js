import React from "react";
import "./NetworkFooter.css";

import { exportAsHAR } from "../har.js";

class NetworkFooter extends React.Component {
  #onHarButtonClick = (entries, timings) => {
    const har = exportAsHAR(entries, timings);
    const blob = new Blob([JSON.stringify(har, null, 2)], {
      type: "application/json",
    });

    // Create a fake download link and trigger the download.
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `bidi-har-${new Date().toISOString()}.har`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  render() {
    const {
      filteredNetworkEntries,
      filteredPageTimings,
    } = this.props;

    return (
      <div className="network-footer">
        <span className="network-summary-item">
          {filteredNetworkEntries.length} requests
        </span>
        <span className="network-summary-item network-summary-timing">
          DOMContentLoaded: {filteredPageTimings.findLast(t => t.type === "domContentLoaded")?.relativeTime}ms
        </span>
        <span className="network-summary-item network-summary-timing">
          load: {filteredPageTimings.findLast(t => t.type === "load")?.relativeTime}ms
        </span>
        <span
          className="network-summary-item network-har-export-button"
          onClick={() => this.#onHarButtonClick(filteredNetworkEntries, filteredPageTimings)}
        >
          Save all as HAR
        </span>
      </div>
    );
  }
}

export default NetworkFooter;
