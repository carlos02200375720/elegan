import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppAdmin from "./AppAdmin";
import "../../index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppAdmin />
    </StrictMode>
  );
}
