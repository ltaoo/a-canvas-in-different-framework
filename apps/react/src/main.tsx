import React from "react";
import ReactDOM from "react-dom/client";

import DesignPage from "./pages/design";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <DesignPage />
  </React.StrictMode>
);
