import React from "react";
import BiDiLogEntry from "./BiDiLogEntry";

import "./BiDiLog.css";

const BiDiLog = ({ log }) => {
  return (
    <div className="bidi-log">
      <ul className="bidi-log__list">
        {log.map((entry) => (
          <BiDiLogEntry entry={entry} key={entry.message}/>
        ))}
      </ul>
    </div>
  );
};

export default BiDiLog;
