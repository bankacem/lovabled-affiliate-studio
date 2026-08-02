// Creates physical index.html files for every public route in reactSnap.include.
// This prevents Vercel/custom hosting from returning 404 on /blog, /designs,
// and all article/design deep links even when SPA fallback rewrites are ignored.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distRoot = resolve(appRoot, "dist/public");
const indexPath = resolve(distRoot, "index.html");
const packagePath = resolve(appRoot, "package.json");

if (!existsSync(indexPath)) {
  throw new Error(`[static-fallbacks] Missing build output: ${indexPath}`);
}

const indexHtml = readFileSync(indexPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const includeRoutes = Array.isArray(pkg.reactSnap?.include) ? pkg.reactSnap.include : [];

// Private routes: they must resolve (no host-level 404) but stay out of the
// sitemap and out of the index (robots.txt already disallows /admin).
const privateRoutes = ["/admin"];

const routes = Array.from(new Set([...includeRoutes, ...privateRoutes]));

let written = 0;

for (const route of routes) {
  if (!route || route === "/" || route.includes("..") || route.includes("?")) continue;
  const cleanRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleanRoute || cleanRoute.includes(".")) continue;

  const outputPath = resolve(distRoot, cleanRoute, "index.html");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, indexHtml);
  written += 1;
}

console.log(`[static-fallbacks] wrote ${written} route index files`);