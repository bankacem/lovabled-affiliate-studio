// Fetches all published blog slugs + design IDs from the backend,
// then updates package.json reactSnap.include and writes public/sitemap.xml.
// Runs before react-snap so every article/design page gets pre-rendered
// HTML with its own meta title/description for Google.
// Dynamic Quality Filter: Excludes pages scoring below 60/100 from sitemap and prerender.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

const SUPABASE_URL = "https://krugmbovsjjgjikgzacl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydWdtYm92c2pqZ2ppa2d6YWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzU3MzAsImV4cCI6MjA4MDk1MTczMH0.d5BKf5JTYjFQLUG62VX5lEEpLD8OnJXe14x1ickCDWQ";
const BASE_URL = "https://aiprintverse.com";

async function fetchAll(table, select, extraQuery = "") {
  // Page through PostgREST (default max 1000 rows/request) so we get ALL rows.
  const all = [];
  const pageSize = 1000;
  let from = 0;
  try {
    while (true) {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${extraQuery ? `&${extraQuery}` : ""}`;
      const r = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${from}-${from + pageSize - 1}`,
          "Range-Unit": "items",
          Prefer: "count=exact",
        },
      });
      if (!r.ok) {
        console.warn(`[prerender-setup] ${table} -> ${r.status} ${await r.text().catch(() => "")}`);
        break;
      }
      const rows = await r.json();
      all.push(...rows);
      if (rows.length < pageSize) break;
      from += pageSize;
      if (from > 20000) break; // safety
    }
  } catch (e) {
    console.warn(`[prerender-setup] ${table} failed:`, e.message);
  }
  return all;
}

function cleanHtmlText(html) {
  if (!html) return "";
  let clean = html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

function calculateQualityScore(page, type) {
  let score = 100;

  if (type === "blog") {
    const title = (page.title || "").trim();
    if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
      score -= 40;
    }
    const content = page.content || "";
    const cleanText = cleanHtmlText(content);
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 100;
    } else if (wordCount < 250) {
      score -= 45;
    } else if (wordCount < 500) {
      score -= 30;
    } else if (wordCount < 800) {
      score -= 15;
    }

    const cleanLower = cleanText.toLowerCase();
    const placeholders = ["lorem ipsum", "placeholder", "todo", "insert here", "text goes here", "[insert", "[your"];
    if (placeholders.some(p => cleanLower.includes(p))) {
      score -= 25;
    }

    const metaDesc = (page.meta_description || "").trim();
    if (!metaDesc) {
      score -= 15;
    } else if (metaDesc.length < 80) {
      score -= 5;
    }

    const ogImage = page.featured_image || page.image_url || "";
    if (!ogImage || !ogImage.startsWith("http")) {
      score -= 15;
    }

    if (!page.author_name) {
      score -= 10;
    }
  } else if (type === "design") {
    const name = (page.name || "").trim();
    if (!name || name.toLowerCase().includes("untitled") || name.toLowerCase() === "no name") {
      score -= 40;
    }

    const desc = page.description || "";
    const cleanDesc = cleanHtmlText(desc);
    const words = cleanDesc.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 40;
    } else if (wordCount < 30) {
      score -= 25;
    } else if (wordCount < 80) {
      score -= 10;
    }

    const imageUrl = page.image_url || "";
    if (!imageUrl || !imageUrl.startsWith("http")) {
      score -= 40;
    }

    const hasStoreLink = !!(page.teepublic_url || page.redbubble_url || page.amazon_url || page.etsy_url);
    if (!hasStoreLink) {
      score -= 30;
    }

    const tags = page.tags || [];
    if (tags.length === 0) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

const staticRoutes = ["/", "/about", "/blog", "/designs"];

const rawPosts = await fetchAll("blog_posts", "slug,title,content,meta_description,featured_image,author_name,updated_at", "status=eq.published");
// Filter out low quality blog posts and invalid slugs
const posts = rawPosts.filter((p) => {
  if (!p || !p.slug || p.slug.trim() === "" || p.slug === "null" || p.slug === "undefined") return false;
  const score = calculateQualityScore(p, "blog");
  return score >= 60;
});

const rawDesigns = await fetchAll("designs", "id,name,description,image_url,teepublic_url,redbubble_url,amazon_url,etsy_url,tags,updated_at");
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

// 2) Write public/sitemap.xml
const urls = include
  .map((path) => {
    const row =
      path.startsWith("/blog/")
        ? posts.find((p) => `/blog/${p.slug}` === path)
        : path.startsWith("/designs/")
        ? designs.find((d) => `/designs/${d.id}` === path)
        : null;
    const lastmod = row?.updated_at
      ? `    <lastmod>${new Date(row.updated_at).toISOString()}</lastmod>\n`
      : "";
    const priority = path === "/" ? "1.0" : path.startsWith("/blog/") || path.startsWith("/designs/") ? "0.7" : "0.8";
    return `  <url>\n    <loc>${BASE_URL}${path}</loc>\n${lastmod}    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(resolve(appRoot, "public/sitemap.xml"), sitemap);
// Also write to dist so the published build serves it without a rebuild of public/
try {
  writeFileSync(resolve(appRoot, "dist/public/sitemap.xml"), sitemap);
} catch {}

// 3) Write a lightweight route -> {title, description, image} map for the
// browser-free meta-tag injector that runs after `vite build`. We already
// have this data in memory from the quality-scoring fetch above, so this
// costs nothing extra and needs no headless browser at all.
const BLOG_TITLE_SUFFIX = " | AIPrintVerse Blog";
const DESIGN_TITLE_SUFFIX = " | AIPrintVerse";

const metaMap = {};
for (const p of posts) {
  metaMap[`/blog/${p.slug}`] = {
    title: `${p.title}${BLOG_TITLE_SUFFIX}`,
    description: p.meta_description || cleanHtmlText(p.content).slice(0, 160),
    image: p.featured_image || undefined,
  };
}
for (const d of designs) {
  metaMap[`/designs/${d.id}`] = {
    title: `${d.name}${DESIGN_TITLE_SUFFIX}`,
    description: cleanHtmlText(d.description).slice(0, 160) || undefined,
    image: d.image_url || undefined,
  };
}
writeFileSync(resolve(appRoot, "public/prerender-meta.json"), JSON.stringify(metaMap));
try {
  writeFileSync(resolve(appRoot, "dist/public/prerender-meta.json"), JSON.stringify(metaMap));
} catch {}

console.log(
  `[prerender-setup] include=${include.length} (blog=${blogRoutes.length}, designs=${designRoutes.length})`
);
