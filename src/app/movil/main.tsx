import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppMovil from "./AppMovil";
import "./estilos.css";
import ErrorBoundary from "./componente/ErrorBoundary";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AppMovil />
      </ErrorBoundary>
    </StrictMode>
  );
}
