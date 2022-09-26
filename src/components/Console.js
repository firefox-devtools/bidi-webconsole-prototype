import ConsoleInput from "./ConsoleInput";

const Console = ({
  consoleOutput,
  consoleValue,
  isClientReady,
  onChange,
  onSubmit,
}) => {
  if (!isClientReady) {
    return null;
  }

  return (
    <div className="flexible-output-input">
      <ul id="console-output">
        {consoleOutput.map((data) => (
          <li key={data.id}>{data.message}</li>
        ))}
      </ul>
      <ConsoleInput
        onChange={onChange}
        onSubmit={onSubmit}
        value={consoleValue}
      />
    </div>
  );
};

export default Console;
