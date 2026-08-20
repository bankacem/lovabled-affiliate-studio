// Fetches all published blog slugs + design IDs from the backend,
// then updates package.json reactSnap.include and writes public/sitemap.xml.
// Runs before react-snap so every article/design page gets pre-rendered
// HTML with its own meta title/description for Google.
// Dynamic Quality Filter: Excludes pages scoring below 60/100 from sitemap and prerender.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateQualityScore, cleanHtmlText } from "../../../supabase/functions/_shared/quality-score.mjs";
import { loadPosts } from "./content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

const BASE_URL = process.env.PUBLIC_BASE_URL || "https://aiprintverse.com";
const CONTENT_API_BASE_URL = (process.env.CONTENT_API_BASE_URL || process.env.API_BASE_URL || "").replace(/\/$/, "");

async function fetchAll(table) {
  if (!CONTENT_API_BASE_URL || table !== "designs") {
    console.warn(`[prerender-setup] no CONTENT_API_BASE_URL configured; skipping ${table} prerender data`);
    return [];
  }
  try {
    const url = `${CONTENT_API_BASE_URL}/api/designs?limit=500&offset=0`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      console.warn(`[prerender-setup] ${table} -> ${response.status} ${await response.text().catch(() => "")}`);
      return [];
    }
    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload.designs || [];
  } catch (error) {
    console.warn(`[prerender-setup] ${table} failed:`, error.message);
    return [];
  }
}

const staticRoutes = ["/", "/about", "/blog", "/designs"];

// Blog posts come from the GitHub-committed markdown in /content/blog — never
// from the database — so a backend outage can never empty the sitemap again.
const rawPosts = loadPosts();
const posts = rawPosts.filter((p) => {
  if (!p || !p.slug || p.slug.trim() === "" || p.slug === "null" || p.slug === "undefined") return false;
  const score = calculateQualityScore(p, "blog");
  return score >= 60;
});

const rawDesigns = await fetchAll("designs");
// Filter out low quality designs
const designs = rawDesigns.filter((d) => {
  if (!d || !d.id || !d.name || d.name.trim() === "" || !d.image_url || d.image_url.trim() === "") return false;
  const score = calculateQualityScore(d, "design");
  return score >= 60;
});

const blogRoutes = posts.map((p) => `/blog/${p.slug}`);
const designRoutes = designs.map((d) => `/designs/${d.id}`);

const include = Array.from(
  new Set([...staticRoutes, ...blogRoutes, ...designRoutes])
);

// 1) Update package.json reactSnap.include
const pkgPath = resolve(appRoot, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.reactSnap = { ...(pkg.reactSnap || {}), include };
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 2) Write static sitemaps from Git content. These files must not depend on
// Supabase or a runtime API: Google fetches them independently of the app.
function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrlset(paths, rowsByPath = new Map()) {
  const urls = paths.map((path) => {
    const row = rowsByPath.get(path);
    const parsedLastmod = row?.updated_at ? new Date(row.updated_at) : null;
    const lastmod = parsedLastmod && !Number.isNaN(parsedLastmod.getTime())
      ? `    <lastmod>${parsedLastmod.toISOString()}</lastmod>\n`
      : "";
    const priority = path === "/" ? "1.0" : path.startsWith("/blog/") || path.startsWith("/designs/") ? "0.7" : "0.8";
    return `  <url>\n    <loc>${escapeXml(`${BASE_URL}${path}`)}</loc>\n${lastmod}    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function writePublicFile(filename, content) {
  writeFileSync(resolve(appRoot, "public", filename), content);
  try {
    writeFileSync(resolve(appRoot, "dist/public", filename), content);
  } catch {}
}

const postsByPath = new Map(blogRoutes.map((path) => [path, posts.find((p) => `/blog/${p.slug}` === path)]));
const designsByPath = new Map(designRoutes.map((path) => [path, designs.find((d) => `/designs/${d.id}` === path)]));
const pagesSitemap = buildUrlset(staticRoutes);
const postsSitemap = buildUrlset(blogRoutes, postsByPath);
const designsSitemap = buildUrlset(designRoutes, designsByPath);
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${escapeXml(`${BASE_URL}/sitemap-pages.xml`)}</loc></sitemap>\n  <sitemap><loc>${escapeXml(`${BASE_URL}/sitemap-posts.xml`)}</loc></sitemap>\n  <sitemap><loc>${escapeXml(`${BASE_URL}/sitemap-designs.xml`)}</loc></sitemap>\n</sitemapindex>\n`;
writePublicFile("sitemap.xml", sitemapIndex);
writePublicFile("sitemap-pages.xml", pagesSitemap);
writePublicFile("sitemap-posts.xml", postsSitemap);
writePublicFile("sitemap-designs.xml", designsSitemap);

// 3) Write a lightweight route -> {title, description, image} map for the
// browser-free meta-tag injector that runs after `vite build`. We already
// have this data in memory from the quality-scoring fetch above, so this
// costs nothing extra and needs no headless browser at all.
const BLOG_TITLE_SUFFIX = " | AIPrintVerse Blog";
const DESIGN_TITLE_SUFFIX = " | AIPrintVerse";

// Builds the same Article JSON-LD shape BlogPost.tsx renders client-side via
// react-helmet-async, so crawlers that only read the static HTML (i.e. never
// wait for/execute the client bundle) still see valid structured data.
// Returns null (skip) if a required field for a valid Article is missing,
// rather than emit JSON-LD Google would flag as incomplete.
function buildArticleJsonLd(p, description) {
  const datePublished = p.published_at || p.created_at;
  if (!p.title || !datePublished || !p.author_name) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": p.title,
    ...(p.featured_image ? { "image": p.featured_image } : {}),
    "datePublished": datePublished,
    "dateModified": p.updated_at || datePublished,
    "author": { "@type": "Person", "name": p.author_name },
    "publisher": {
      "@type": "Organization",
      "name": "AIPrintVerse",
      "url": BASE_URL,
    },
    "description": description,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${p.slug}`,
    },
  };
}

// Formats a date the same way BlogPost.tsx does client-side
// (date-fns `format(date, "MMMM d, yyyy")`), without adding a date-fns
// dependency to this build script.
function formatDisplayDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

// Data needed to bake a real, readable snapshot of the article body into
// <div id="root"> at build time (see inject-meta-tags.mjs -> injectBody),
// instead of shipping an empty div that only fills in after the client JS
// bundle runs. main.tsx already hydrates instead of client-rendering
// whenever #root has content, so no client-side changes are needed for
// this to take effect. Returns null if there's no real content to show
// (mirrors BlogPost.tsx's own "excerpt only, no content" fallback).
function buildArticleBody(p) {
  if (!p.title || (!p.content && !p.excerpt)) return null;
  return {
    title: p.title,
    category: p.category || null,
    authorName: p.author_name || null,
    dateDisplay: formatDisplayDate(p.published_at || p.created_at),
    readTime: p.read_time || null,
    tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : [],
    featuredImage: p.featured_image || null,
    // Trusted HTML from our own CMS - already rendered the same way
    // client-side today via dangerouslySetInnerHTML in BlogPost.tsx, so
    // baking it into the static HTML introduces no new trust boundary.
    contentHtml: p.content || null,
    excerpt: p.excerpt || null,
  };
}

// Same purpose as buildArticleBody, for design detail pages. Design pages
// have much shorter body text than articles (a short description + tags,
// no long-form content field) - still worth baking in since the page is
// otherwise just as empty (<div id="root"></div>) as blog posts were.
function buildDesignBody(d) {
  if (!d.name) return null;
  return {
    name: d.name,
    category: d.category || null,
    description: d.description || null,
    tags: Array.isArray(d.tags) ? d.tags.filter(Boolean) : [],
    imageUrl: d.image_url || null,
  };
}

const metaMap = {};
for (const p of posts) {
  const description = p.meta_description || cleanHtmlText(p.content).slice(0, 160);
  metaMap[`/blog/${p.slug}`] = {
    title: `${p.title}${BLOG_TITLE_SUFFIX}`,
    description,
    image: p.featured_image || undefined,
    jsonLd: buildArticleJsonLd(p, description),
    body: buildArticleBody(p),
  };
}
for (const d of designs) {
  metaMap[`/designs/${d.id}`] = {
    title: `${d.name}${DESIGN_TITLE_SUFFIX}`,
    description: cleanHtmlText(d.description).slice(0, 160) || undefined,
    image: d.image_url || undefined,
    designBody: buildDesignBody(d),
  };
}
writeFileSync(resolve(appRoot, "public/prerender-meta.json"), JSON.stringify(metaMap));
try {
  writeFileSync(resolve(appRoot, "dist/public/prerender-meta.json"), JSON.stringify(metaMap));
} catch {}

console.log(
  `[prerender-setup] include=${include.length} (blog=${blogRoutes.length}, designs=${designRoutes.length})`
);
