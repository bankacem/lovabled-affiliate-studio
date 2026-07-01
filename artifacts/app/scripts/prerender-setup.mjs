// Fetches all published blog slugs + design IDs from the backend,
// then updates package.json reactSnap.include and writes public/sitemap.xml.
// Runs before react-snap so every article/design page gets pre-rendered
// HTML with its own meta title/description for Google.

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

const staticRoutes = ["/", "/about", "/blog", "/designs"];

const posts = await fetchAll("blog_posts", "slug,updated_at", "status=eq.published");
const designs = await fetchAll("designs", "id,updated_at");

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

console.log(
  `[prerender-setup] include=${include.length} (blog=${blogRoutes.length}, designs=${designRoutes.length})`
);
