import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/editor.css";

// Every route's static HTML (baked at build time, see
// artifacts/app/scripts/inject-meta-tags.mjs) ships its own <title>,
// <meta name="description">, <meta property="og:*">, <meta name="twitter:*">
// and <link rel="canonical"> so crawlers that don't run JS still see the
// right tags. Every page component also renders its own <Helmet> with the
// same tags for client-side navigation. react-helmet-async has no way to
// know about the static tags — they were never created by React — so it
// just appends its own on top, leaving two of everything in the live DOM
// (confirmed independently via an SEO audit tool flagging duplicate
// canonical tags). Strip the static ones here, once, before Helmet ever
// gets a chance to add its own, so there's only ever one of each.
function stripStaticSeoTags() {
  const selectors = [
    'link[rel="canonical"]',
    'meta[name="description"]',
    'meta[property^="og:"]',
    'meta[name^="twitter:"]',
    'meta[property^="twitter:"]',
  ];
  for (const selector of selectors) {
    document.head.querySelectorAll(selector).forEach((el) => el.remove());
  }
  // react-helmet-async inserts a genuine second <title> DOM node rather
  // than updating the existing one (confirmed via headless browser test),
  // so the static one must go too — but only once Helmet is guaranteed to
  // add its own; every page component in this app renders a <title> via
  // Helmet, so this is always safe.
  const staticTitle = document.head.querySelector("title");
  if (staticTitle) staticTitle.remove();
}
stripStaticSeoTags();

const rootElement = document.getElementById("root")!;

// react-snap pre-renders the HTML at build time. If the root already has
// markup, hydrate instead of replacing it so Google sees real content.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}
