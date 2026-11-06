import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppWeb from "./AppWeb";
import "./estilos.css";
import ErrorBoundary from "./components/ErrorBoundary";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AppWeb />
      </ErrorBoundary>
    </StrictMode>
  );
}
