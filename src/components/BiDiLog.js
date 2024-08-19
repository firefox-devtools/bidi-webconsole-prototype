import React from "react";
import BiDiLogEntry from "./BiDiLogEntry";
import BiDCommandInput from "./BiDCommandInput";

import "./BiDiLog.css";

const BiDiLog = ({ bidiCommand, log, onBidiCommandChange, sendCommand }) => {
  return (
    <div className="bidi-log">
      <ul className="bidi-log__list">
        <BiDCommandInput
          onInputChange={onBidiCommandChange}
          onSubmit={sendCommand}
          value={bidiCommand}
        />
        {log.toReversed().map((entry) => (
          <BiDiLogEntry entry={entry} key={entry.message} />
        ))}
      </ul>
    </div>
  );
};

export default BiDiLog;
