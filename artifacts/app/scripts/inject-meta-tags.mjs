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

import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distRoot = resolve(appRoot, "dist", "public");
const indexPath = resolve(distRoot, "index.html");
const metaMapPath = resolve(distRoot, "prerender-meta.json");
const assetVersion = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString()).slice(0, 12);

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

// Vercel/Cloudflare returns 404 for same-origin static assets when the browser
// sends an Origin header from a `crossorigin` module/link tag. Vite adds this
// attribute by default. Remove it from the final HTML; same-origin assets do
// not need CORS, and this keeps the production bootstrap executable.
function stripSameOriginCrossorigin(html) {
  return html.replace(/\s+crossorigin(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
}

function sanitizeBuiltHtml(html) {
  const withoutCors = stripSameOriginCrossorigin(html);
  return withoutCors.replace(/((?:src|href)="\/assets\/[^"?]+)"/gi, `$1?v=${assetVersion}"`);
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

// Inserts an Article JSON-LD <script> right before </head>. Only blog routes
// carry a jsonLd object in prerender-meta.json (see prerender-setup.mjs);
// design/static routes are left untouched. The id="prerendered-article-ld"
// marker lets BlogPost.tsx remove this exact node on mount before
// react-helmet-async injects its own client-side copy, so the two never
// coexist in the live DOM.
function injectJsonLd(html, jsonLd) {
  if (!jsonLd) return html;
  if (!html.includes("</head>")) return html;
  const script = `<script type="application/ld+json" id="prerendered-article-ld">${JSON.stringify(jsonLd)}</script>\n</head>`;
  return html.replace("</head>", script);
}

function renderTags(tags) {
  if (!tags || !tags.length) return "";
  const items = tags
    .map((t) => `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">${escapeHtml(t)}</span>`)
    .join("");
  return `<div class="mt-4 flex flex-wrap gap-2">${items}</div>`;
}

// Renders the same article structure BlogPost.tsx renders client-side
// (title, category, author/date/read-time row, tags, featured image,
// content) as a plain HTML string, and returns it ready to drop into
// <div id="root">. Framer-motion's mount-in animation attributes aren't
// replicated here (this is plain HTML, not a live React tree) - React
// hydrates over this on mount and takes over animation/interactivity
// itself; any attribute mismatch here is a recoverable hydration warning,
// not a functional break, and the crawler-visible text is unaffected.
function renderArticleBody(body) {
  const title = escapeHtml(body.title);
  const category = body.category ? `<span class="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">${escapeHtml(body.category)}</span>` : "";
  const metaRow = [
    body.authorName ? `<span class="flex items-center gap-1">${escapeHtml(body.authorName)}</span>` : "",
    body.dateDisplay ? `<span class="flex items-center gap-1">${escapeHtml(body.dateDisplay)}</span>` : "",
    body.readTime ? `<span class="flex items-center gap-1">${escapeHtml(body.readTime)}</span>` : "",
  ].join("");
  const image = body.featuredImage
    ? `<div class="mt-8 overflow-hidden rounded-2xl"><img src="${escapeHtml(body.featuredImage)}" alt="${title}" loading="eager" width="1200" height="630" class="h-full w-full object-cover" /></div>`
    : "";
  // contentHtml is trusted CMS HTML (same source already rendered via
  // dangerouslySetInnerHTML client-side) - not escaped, inserted as-is.
  const content = body.contentHtml
    ? `<div class="prose prose-lg mt-10 max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-primary article-content">${body.contentHtml}</div>`
    : body.excerpt
    ? `<div class="mt-10"><p class="text-lg text-muted-foreground">${escapeHtml(body.excerpt)}</p></div>`
    : "";

  return (
    `<article class="py-8 md:py-12"><div class="container mx-auto px-4 md:px-6"><div class="mx-auto max-w-3xl">` +
    `<header>${category}<h1 class="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">${title}</h1>` +
    `<div class="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">${metaRow}</div>` +
    renderTags(body.tags) +
    `</header>${image}${content}</div></div></article>`
  );
}

function injectBody(html, body) {
  if (!body) return html;
  const snapshot = renderArticleBody(body);
  // Only ever matches the specific empty-root marker create-static-fallbacks.mjs
  // writes for every route; if that marker isn't found (template changed,
  // or root already has content for some other reason) this is a no-op
  // rather than risking a malformed replace.
  if (!/<div id="root">\s*<\/div>/.test(html)) return html;
  return html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${snapshot}</div>`);
}

// Renders a design detail page snapshot (name, category, description,
// tags, image). Simpler than renderArticleBody: designs have no
// long-form content field, just a short description, so no
// dangerouslySetInnerHTML-equivalent trusted-HTML block is needed here -
// description is plain text and gets escaped like every other text field.
function renderDesignBody(body) {
  const name = escapeHtml(body.name);
  const category = body.category ? `<span class="text-sm font-medium text-primary">${escapeHtml(body.category)}</span>` : "";
  const description = body.description
    ? `<p class="mt-4 text-muted-foreground leading-relaxed">${escapeHtml(body.description)}</p>`
    : "";
  const image = body.imageUrl
    ? `<div class="overflow-hidden rounded-2xl bg-secondary shadow-lg"><img src="${escapeHtml(body.imageUrl)}" alt="${name}" loading="eager" class="h-full w-full object-cover" /></div>`
    : "";

  return (
    `<section class="py-8 md:py-12"><div class="container mx-auto px-4 md:px-6">` +
    `<div class="grid gap-10 lg:grid-cols-2">` +
    `<div>${image}</div>` +
    `<div class="flex flex-col"><div>${category}<h1 class="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">${name}</h1></div>` +
    description + renderTags(body.tags) +
    `</div></div></div></section>`
  );
}

function injectDesignBody(html, body) {
  if (!body) return html;
  const snapshot = renderDesignBody(body);
  if (!/<div id="root">\s*<\/div>/.test(html)) return html;
  return html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${snapshot}</div>`);
}

function main() {
  if (!existsSync(indexPath)) {
    console.warn("[inject-meta-tags] missing dist/public/index.html, skipping");
    return;
  }

  const genericHtml = sanitizeBuiltHtml(readFileSync(indexPath, "utf8"));
  writeFileSync(indexPath, genericHtml);

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
    let html = injectMeta(genericHtml, { ...meta, canonicalHref });
    html = injectJsonLd(html, meta.jsonLd);
    html = injectBody(html, meta.body);
    html = injectDesignBody(html, meta.designBody);
    writeFileSync(routeIndexPath, html);
    written++;
  }

  // Internal-only file, never meant to be served publicly.
  rmSync(metaMapPath, { force: true });

  // Also sanitize fallback pages that are intentionally excluded from the
  // public SEO route list, such as /admin and /studio.
  const htmlFiles = [];
  const pending = [distRoot];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = resolve(current, entry.name);
      if (entry.isDirectory()) pending.push(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(fullPath);
    }
  }
  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, "utf8");
    const sanitized = sanitizeBuiltHtml(html);
    if (sanitized !== html) writeFileSync(htmlPath, sanitized);
  }

  console.log(`[inject-meta-tags] injected page-specific meta/canonical tags into ${written} route(s), no browser required`);
}

main();
