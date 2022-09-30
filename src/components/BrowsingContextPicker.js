import React from "react";
import BrowsingContextList from "./BrowsingContextList";
import { findContextById } from "../utils";
import useOutsideClick from "../hooks/useOutsideClick";

import "./BrowsingContextPicker.css";

const BrowsingContextPicker = ({
  buttonClassName = "",
  buttonTitle,
  listClassName = "",
  contexts,
  selectedId,
  setSelectedBrowsingContext,
}) => {
  const [isListVisible, setIsListVisible] = React.useState(false);
  const selectedContext = findContextById(contexts, selectedId);
  const close = () => setIsListVisible(false);
  const ref = useOutsideClick(close);

  return (
    <div className="BrowsingContextPicker" ref={ref}>
      <button
        className={`webconsole-evaluation-selector-button devtools-button devtools-dropdown-button ${buttonClassName}`}
        onClick={() => setIsListVisible(!isListVisible)}
        title={buttonTitle}
      >
        {selectedContext.url}
      </button>
      <BrowsingContextList
        className={listClassName}
        close={close}
        contexts={contexts}
        selectedId={selectedId}
        setSelectedContext={setSelectedBrowsingContext}
        isVisible={isListVisible}
      />
    </div>
  );
};

export default BrowsingContextPicker;
