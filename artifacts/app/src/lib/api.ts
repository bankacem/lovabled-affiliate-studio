import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

export function initApiClient() {
  // The generated API client calls paths like /api/designs, /api/blog/posts etc.
  // The Vite proxy forwards /api/* → http://localhost:8080/api/*
  // So we set base URL to empty string (same-origin) — no prefix needed.
  setBaseUrl("");
  setAuthTokenGetter(() => localStorage.getItem("auth_token"));
}
