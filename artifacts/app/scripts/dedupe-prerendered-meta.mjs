// After react-snap crawls each route, the resulting HTML contains BOTH the
// generic static <title>/<meta> tags from index.html AND the page-specific
// ones injected client-side by react-helmet-async (which appends rather than
// replaces when there's no true SSR reconciliation). This leaves duplicate
// tags in the head. This script walks every prerendered index.html under
// dist/public and keeps only the LAST occurrence of <title> and of each
// uniquely-keyed <meta> tag (by name= or property=), which is always the
// Helmet-injected, page-correct one.
//
// Safe by design: it only ever REMOVES exact duplicate tag types, never
// rewrites content, so a route with no duplicates is left byte-identical.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distRoot = resolve(__dirname, "..", "dist", "public");

// The pristine, never-snapped index.html (captured by the build script right
// after `vite build`, before react-snap runs) tells us exactly what the
// generic/default title and meta tags look like. We use this — not tag
// order, which is NOT consistent between <title> and <meta> in practice —
// to decide which duplicate to drop.
const PRISTINE_PATH = resolve(distRoot, "index.html.pristine");
if (!existsSync(PRISTINE_PATH)) {
  console.warn("[dedupe-prerendered-meta] no pristine snapshot found, skipping (safe no-op)");
  process.exit(0);
}
const pristineHtml = readFileSync(PRISTINE_PATH, "utf8");

function extractGenericDefaults(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const genericTitle = titleMatch ? titleMatch[1] : null;

  const genericMeta = new Map(); // key -> content
  for (const m of html.matchAll(/<meta\s[^>]*>/gi)) {
    const key = metaKey(m[0]);
    const contentMatch = m[0].match(/\scontent=["']([^"']*)["']/i);
    if (key && contentMatch) genericMeta.set(key, contentMatch[1]);
  }
  return { genericTitle, genericMeta };
}

function findIndexHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...findIndexHtmlFiles(full));
    else if (entry === "index.html") out.push(full);
  }
  return out;
}

function metaKey(tag) {
  const nameMatch = tag.match(/\sname=["']([^"']+)["']/i);
  const propMatch = tag.match(/\sproperty=["']([^"']+)["']/i);
  if (nameMatch) return `name:${nameMatch[1].toLowerCase()}`;
  if (propMatch) return `property:${propMatch[1].toLowerCase()}`;
  return null; // charset, viewport etc. without name/property — leave alone
}

function collapseExactDuplicates(html, regex, groupIndex) {
  let changed = false;
  const matches = [...html.matchAll(regex)];
  const seenContent = new Set();
  for (const m of matches) {
    const content = groupIndex != null ? m[groupIndex] : m[0];
    if (seenContent.has(content)) {
      html = html.replace(m[0], "");
      changed = true;
    } else {
      seenContent.add(content);
    }
  }
  return { html, changed };
}

function dedupeHead(html, generic) {
  let changed = false;

  // 0) Unconditionally safe pass: two tags with byte-identical content are
  // always redundant regardless of which one is "generic" — collapse to one.
  {
    const r1 = collapseExactDuplicates(html, /<title>([\s\S]*?)<\/title>/gi, 1);
    html = r1.html; changed = changed || r1.changed;
    const r2 = collapseExactDuplicates(html, /<meta\s[^>]*>/gi, 0);
    html = r2.html; changed = changed || r2.changed;
  }

  // 1) <title>: if there are multiple, drop any copy that matches the
  // generic/default title verbatim, as long as a page-specific one remains.
  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (titleMatches.length > 1) {
    const hasSpecific = titleMatches.some((m) => m[1] !== generic.genericTitle);
    if (hasSpecific) {
      for (const m of titleMatches) {
        if (m[1] === generic.genericTitle) {
          html = html.replace(m[0], "");
          changed = true;
        }
      }
    }
  }

  // 2) <meta name="..."> / <meta property="...">: same idea per key — drop
  // the copy whose content matches the generic default when a differing,
  // page-specific copy of the same tag also exists.
  const metaMatches = [...html.matchAll(/<meta\s[^>]*>/gi)];
  const byKey = new Map(); // key -> [{full, content}]
  for (const m of metaMatches) {
    const key = metaKey(m[0]);
    if (!key) continue;
    const contentMatch = m[0].match(/\scontent=["']([^"']*)["']/i);
    const content = contentMatch ? contentMatch[1] : "";
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ full: m[0], content });
  }
  for (const [key, tags] of byKey.entries()) {
    if (tags.length < 2) continue;
    const genericContent = generic.genericMeta.get(key);
    const hasSpecific = tags.some((t) => t.content !== genericContent);
    if (!hasSpecific) continue; // all identical (or no known generic) — leave alone
    for (const t of tags) {
      if (t.content === genericContent) {
        html = html.replace(t.full, "");
        changed = true;
      }
    }
  }

  return { html, changed };
}

const generic = extractGenericDefaults(pristineHtml);

let filesChanged = 0;
for (const file of findIndexHtmlFiles(distRoot)) {
  const original = readFileSync(file, "utf8");
  const { html, changed } = dedupeHead(original, generic);
  if (changed) {
    writeFileSync(file, html);
    filesChanged++;
  }
}

console.log(`[dedupe-prerendered-meta] cleaned duplicate tags in ${filesChanged} file(s)`);
