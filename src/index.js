import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";

import "./css/codemirror.css";
import "./css/variables.css";
import "./css/webconsole.css";
import "./css/reps.css";
import "./css/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
