import ConsoleInput from "./ConsoleInput";
import ConsoleOutput from "./ConsoleOutput";
import "./Console.css";

const Console = ({
  browsingContexts,
  consoleOutput,
  consoleValue,
  isClientReady,
  onChange,
  onSubmit,
  evaluationBrowsingContextId,
  filteringBrowsingContextId,
  setEvaluationBrowsingContext,
}) => {
  if (!isClientReady) {
    return null;
  }

  return (
    <div className="webconsole-app">
      <div className="flexible-output-input">
        <ConsoleOutput
          messages={consoleOutput}
          selectedBrowsingContextId={filteringBrowsingContextId}
        />
        <ConsoleInput
          onChange={onChange}
          onSubmit={onSubmit}
          value={consoleValue}
          evaluationBrowsingContextId={evaluationBrowsingContextId}
          browsingContexts={browsingContexts}
          setSelectedBrowsingContext={setEvaluationBrowsingContext}
        />
      </div>
    </div>
  );
};

export default Console;
