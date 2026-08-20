import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MethodologyPage } from "./MethodologyPage";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MethodologyPage />
  </StrictMode>,
);
