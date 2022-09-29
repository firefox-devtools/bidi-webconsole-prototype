import ConsoleInput from "./ConsoleInput";
import ConsoleOutput from "./ConsoleOutput";
import "./Console.css";

const Console = ({
  consoleOutput,
  consoleValue,
  isClientReady,
  onChange,
  onSubmit,
  selectedBrowsingContextId,
}) => {
  if (!isClientReady) {
    return null;
  }

  return (
    <div className="webconsole-app">
      <div className="flexible-output-input">
        <ConsoleOutput
          messages={consoleOutput}
          selectedBrowsingContextId={selectedBrowsingContextId}
        />
        <ConsoleInput
          onChange={onChange}
          onSubmit={onSubmit}
          value={consoleValue}
        />
      </div>
    </div>
  );
};

export default Console;
