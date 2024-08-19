import React from "react";

import "./BiDCommandInput.css";

const BiDCommandInput = ({ onInputChange, onSubmit, value }) => {
  return (
    <li className="BiDiCommandInput">
      <form className="BiDiCommandInput__form" onSubmit={onSubmit}>
        <input
          className="BiDiCommandInput__input"
          id="bidiCommand"
          name="bidiCommand"
          onChange={onInputChange}
          placeholder="Write a BiDi command here to send it to the browser"
          value={value}
        />
        <button className="entry__type BiDiCommandInput__button">Send</button>
      </form>
    </li>
  );
};

export default BiDCommandInput;
