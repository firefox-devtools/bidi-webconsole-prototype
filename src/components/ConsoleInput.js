import "./ConsoleInput.css";

const ConsoleInput = ({ onChange, onSubmit, value }) => (
  <form onSubmit={onSubmit} className="jsterm-input-container">
    <input
      type="text"
      id="consoleInput"
      name="consoleInput"
      className="CodeMirror"
      value={value}
      onChange={onChange}
    />
  </form>
);

export default ConsoleInput;
