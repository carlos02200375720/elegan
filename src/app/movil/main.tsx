import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppMovil from "./AppMovil";
import "../../index.css";
import ErrorBoundary from "../web/components/ErrorBoundary";

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
