import React from "react";

import "./BiDiLogEntry.css";

const BiDiLogEntry = ({ entry }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <li className="entry">
      <span
        onClick={() => entry.type !== "ws" && setExpanded(!expanded)}
        className={`entry__type ${expanded ? "entry__type_expanded" : ""}`}
        title="click to expand/collapse"
      >
        {entry.type}
      </span>
      <span
        className={`entry__message ${
          expanded ? "entry__message_expanded" : ""
        }`}
      >
        {entry.type === "response" || entry.type === "request"
          ? JSON.stringify(JSON.parse(entry.message), null, 4)
          : entry.message}
      </span>
    </li>
  );
};

export default BiDiLogEntry;
