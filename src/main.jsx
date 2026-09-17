import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { AttendanceProvider } from "./context/AttendanceContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AttendanceProvider>
      <App />
    </AttendanceProvider>
  </React.StrictMode>
);