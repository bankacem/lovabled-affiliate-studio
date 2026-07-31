// Runs AFTER `vite build` and `create-static-fallbacks.mjs`.
//
// 1. Captures a pristine copy of the generic index.html (used later to tell
//    real page-specific meta tags apart from the generic defaults).
// 2. Runs react-snap to bake real, per-route HTML + meta tags into each
//    route's index.html (this is what actually fixes the SEO/meta-tag issue).
// 3. Runs the dedupe pass to remove leftover duplicate <title>/<meta> tags
//    (a known react-snap + client-only-Helmet quirk — see
//    dedupe-prerendered-meta.mjs for the full explanation).
// 4. Deletes the pristine reference file so it's never served publicly.
//
// If react-snap fails for any reason (e.g. a route errors out, Chromium
// isn't available in the build environment), the build does NOT fail —
// the generic static fallback pages written by create-static-fallbacks.mjs
// remain in place, so the site keeps working exactly as it does today.
// This script only ever makes things better, never worse.

import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distRoot = resolve(appRoot, "dist", "public");
const indexPath = resolve(distRoot, "index.html");
const pristinePath = resolve(distRoot, "index.html.pristine");

async function main() {
  if (!existsSync(indexPath)) {
    console.warn("[prerender-run] no dist/public/index.html found, skipping prerender step");
    return;
  }

  copyFileSync(indexPath, pristinePath);

  try {
    const { run } = await import("react-snap");
    const pkg = JSON.parse(
      (await import("node:fs")).readFileSync(resolve(appRoot, "package.json"), "utf8"),
    );
    // react-snap's own CLI (run.js) merges pkg.reactSnap into the options
    // before calling run() — the bare exported run() does NOT read
    // package.json itself, so we replicate that merge here.
    await run({ ...pkg.reactSnap });
    console.log("[prerender-run] react-snap completed");
  } catch (err) {
    console.warn("[prerender-run] react-snap failed — falling back to generic static pages for all routes.");
    console.warn(String(err && err.stack ? err.stack : err));
    // Do not rethrow: create-static-fallbacks.mjs already guarantees every
    // route has *a* valid index.html, just without page-specific meta tags.
  }

  try {
    execFileSync(process.execPath, [resolve(__dirname, "dedupe-prerendered-meta.mjs")], {
      stdio: "inherit",
    });
  } catch (err) {
    console.warn("[prerender-run] dedupe step failed (non-fatal):", String(err));
  }

  if (existsSync(pristinePath)) unlinkSync(pristinePath);
}

main();
