import React from "react";
import BiDiLogEntry from "./BiDiLogEntry";
import BiDiCommandInput from "./BiDiCommandInput";

import "./BiDiLog.css";

const BiDiLog = ({ bidiCommand, log, onBidiCommandChange, sendCommand }) => {
  return (
    <div className="bidi-log">
      <ul className="bidi-log__list">
        <BiDiCommandInput
          onInputChange={onBidiCommandChange}
          onSubmit={sendCommand}
          value={bidiCommand}
        />
        {log.toReversed().map((entry, index) => (
          <BiDiLogEntry entry={entry} key={entry.message + index} />
        ))}
      </ul>
    </div>
  );
};

export default BiDiLog;
