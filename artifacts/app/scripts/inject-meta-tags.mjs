// Bakes per-route <title>/<meta description>/<meta og:*>/<link canonical> tags
// into each route's static index.html — WITHOUT launching a browser.
//
// Why this exists instead of react-snap + Puppeteer:
// Real-world testing on Vercel's build machine showed react-snap's bundled
// Chromium (puppeteer@1.20.0, from 2019) fails to launch there
// ("libnss3.so: cannot open shared object file"), and worse, the failure
// left an internal server open, hanging the whole build until Vercel's
// 45-minute timeout killed it. A missing shared library in a build image is
// exactly the kind of external dependency we can't reliably control from
// inside this repo.
//
// This script sidesteps the entire problem: prerender-setup.mjs already
// fetches each post/design's title + meta_description from the database (to
// compute its quality score) and writes it to public/prerender-meta.json.
// All we need to do here is take the generic static index.html that
// create-static-fallbacks.mjs already wrote for every route, and swap in the
// route-specific title/description with a plain string replace. No DOM, no
// browser, nothing that can hang or fail to launch.
//
// Trade-off vs react-snap: this does NOT bake the full rendered page body
// into the HTML (react-snap did, when it worked). It only fixes the <head>
// tags. That is the part that actually matters for SEO snippets and social
// link previews, which is the problem we set out to fix — the page body is
// still rendered client-side exactly as it is today, unchanged.

import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distRoot = resolve(appRoot, "dist", "public");
const indexPath = resolve(distRoot, "index.html");
const metaMapPath = resolve(distRoot, "prerender-meta.json");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceTag(html, regex, replacement) {
  return regex.test(html) ? html.replace(regex, replacement) : html;
}

function injectMeta(html, { title, description, image, canonicalHref }) {
  let out = html;

  if (canonicalHref) {
    const safe = escapeHtml(canonicalHref);
    out = replaceTag(out, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${safe}" />`);
  }

  if (title) {
    const safe = escapeHtml(title);
    out = replaceTag(out, /<title>[\s\S]*?<\/title>/i, `<title>${safe}</title>`);
    out = replaceTag(
      out,
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safe}" />`,
    );
    out = replaceTag(
      out,
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safe}" />`,
    );
  }

  if (description) {
    const safe = escapeHtml(description);
    out = replaceTag(out, /<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${safe}" />`);
    out = replaceTag(
      out,
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safe}" />`,
    );
    out = replaceTag(
      out,
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safe}" />`,
    );
  }

  if (image) {
    const safe = escapeHtml(image);
    out = replaceTag(out, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${safe}" />`);
    out = replaceTag(
      out,
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${safe}" />`,
    );
  }

  return out;
}

function main() {
  if (!existsSync(indexPath)) {
    console.warn("[inject-meta-tags] missing dist/public/index.html, skipping");
    return;
  }

  const genericHtml = readFileSync(indexPath, "utf8");

  // Every generic static index.html (written by create-static-fallbacks.mjs
  // for every route in reactSnap.include) currently carries the SAME
  // hardcoded canonical URL — the homepage's — because they're all literal
  // copies of the same source file. That tells search engines every route
  // is a duplicate of the homepage. We fix this for every route, not just
  // the ones with blog/design meta data.
  const canonicalMatch = genericHtml.match(/<link rel="canonical" href="([^"]*)"/i);
  let origin = null;
  if (canonicalMatch) {
    try {
      origin = new URL(canonicalMatch[1]).origin;
    } catch {}
  }

  const metaMap = existsSync(metaMapPath) ? JSON.parse(readFileSync(metaMapPath, "utf8")) : {};

  const pkgPath = resolve(appRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const routes = Array.isArray(pkg.reactSnap?.include) ? pkg.reactSnap.include : [];

  let written = 0;
  for (const route of routes) {
    if (route === "/") continue; // homepage's own canonical is already correct
    const routeIndexPath = resolve(distRoot, `.${route}`, "index.html");
    if (!existsSync(routeIndexPath)) continue; // create-static-fallbacks.mjs should have written this already

    const canonicalHref = origin ? `${origin}${route}` : undefined;
    const meta = metaMap[route] || {};
    const html = injectMeta(genericHtml, { ...meta, canonicalHref });
    writeFileSync(routeIndexPath, html);
    written++;
  }

  // Internal-only file, never meant to be served publicly.
  rmSync(metaMapPath, { force: true });

  console.log(`[inject-meta-tags] injected page-specific meta/canonical tags into ${written} route(s), no browser required`);
}

main();
