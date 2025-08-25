import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { suppressResizeObserverError } from "./lib/resizeObserverFix";

// Suppress ResizeObserver errors from chart libraries
suppressResizeObserverError();

createRoot(document.getElementById("root")!).render(<App />);
