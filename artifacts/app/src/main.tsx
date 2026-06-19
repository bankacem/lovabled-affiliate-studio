import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/editor.css";

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);
