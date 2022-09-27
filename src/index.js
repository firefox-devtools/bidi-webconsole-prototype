import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";

import "./theme/variables.css";
import "./theme/webconsole.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
