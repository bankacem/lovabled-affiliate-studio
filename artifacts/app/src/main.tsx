import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/editor.css";

const rootElement = document.getElementById("root")!;

// react-snap pre-renders the HTML at build time. If the root already has
// markup, hydrate instead of replacing it so Google sees real content.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}
