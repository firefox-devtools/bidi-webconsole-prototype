import React from "react";
import BrowsingContextList from "./BrowsingContextList";
import { findContextById } from "../utils";

import "./BrowsingContextPicker.css";

const BrowsingContextPicker = ({
  buttonClassName = "",
  listClassName = "",
  contexts,
  selectedId,
  setSelectedBrowsingContext,
}) => {
  const [isListVisible, setIsListVisible] = React.useState(false);
  const selectedContext = findContextById(contexts, selectedId);

  return (
    <>
      <button
        className={`webconsole-evaluation-selector-button devtools-button devtools-dropdown-button ${buttonClassName}`}
        onClick={() => setIsListVisible(!isListVisible)}
        title="Select a browsing context"
      >
        {selectedContext.url}
      </button>
      <BrowsingContextList
        className={listClassName}
        close={() => setIsListVisible(false)}
        contexts={contexts}
        selectedId={selectedId}
        setSelectedContext={setSelectedBrowsingContext}
        isVisible={isListVisible}
      />
    </>
  );
};

export default BrowsingContextPicker;
