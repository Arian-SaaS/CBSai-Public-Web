import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ArtemisOrbit from "./ArtemisOrbit";
import "./index.css";

const rootElement = document.getElementById("animate-hero-root");

if (!rootElement) {
  throw new Error("CBSai hero mount point was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Second React island: the Artemis orbit inside the ecosystem section.
const orbitElement = document.getElementById("artemis-orbit-root");

if (orbitElement) {
  createRoot(orbitElement).render(
    <React.StrictMode>
      <ArtemisOrbit />
    </React.StrictMode>,
  );
}
