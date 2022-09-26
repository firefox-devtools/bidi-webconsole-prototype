const ConsoleInput = ({ onChange, onSubmit, value }) => (
  <form onSubmit={onSubmit}>
    <input
      type="text"
      id="consoleInput"
      name="consoleInput"
      value={value}
      onChange={onChange}
    />
  </form>
);

export default ConsoleInput;
