import React from "react";
import ReactDOM from "react-dom/client";
import { registerMicroApps, start, loadScript } from "rich";

import App from "./App";

import "./index.css";

// @ts-ignore
window.__RICH__ = true;
// @ts-ignore
window.__RICH__configure_callback_ = function (configures) {
  console.log("[]before registerMicroApps", configures);
  registerMicroApps(configures);
};
loadScript("/a-canvas-in-different-framework/assets/configure.js");

ReactDOM.createRoot(document.getElementById("main_root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
