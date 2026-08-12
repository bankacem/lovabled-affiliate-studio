// Standalone full-content export. Works with plain Node 18+, no Lovable needed.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_KEY=... node scripts/export-all.mjs ./export
//
// SUPABASE_KEY: the public (anon) key works for published content.
// For everything (drafts included) sign in first and pass the admin access_token.
//
// Output: ./export/<table>.json  +  ./export/markdown/<slug>.md for blog posts.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL_BASE = process.env.SUPABASE_URL || "https://krugmbovsjjgjikgzacl.supabase.co";
const KEY = process.env.SUPABASE_KEY;
const OUT = process.argv[2] || "./export";

if (!KEY) {
  console.error("Missing SUPABASE_KEY env var");
  process.exit(1);
}

const TABLES = [
  "blog_posts",
  "blog_categories",
  "designs",
  "stores",
  "seo_templates",
  "page_views",
  "link_tracking",
];

async function fetchAll(table) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from < 100000; from += pageSize) {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) {
      console.warn(`[skip] ${table}: ${res.status} ${await res.text().catch(() => "")}`);
      return rows;
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "markdown"), { recursive: true });

for (const table of TABLES) {
  const rows = await fetchAll(table);
  writeFileSync(join(OUT, `${table}.json`), JSON.stringify(rows, null, 2));
  console.log(`${table}: ${rows.length} rows`);

  if (table === "blog_posts") {
    for (const p of rows) {
      if (!p.slug) continue;
      const fm = [
        "---",
        `title: ${JSON.stringify(p.title || "")}`,
        `slug: ${JSON.stringify(p.slug)}`,
        `description: ${JSON.stringify(p.meta_description || p.excerpt || "")}`,
        `category: ${JSON.stringify(p.category || "")}`,
        `tags: ${JSON.stringify(p.tags || [])}`,
        `status: ${JSON.stringify(p.status || "")}`,
        `image: ${JSON.stringify(p.featured_image || "")}`,
        `published_at: ${JSON.stringify(p.published_at || p.created_at || "")}`,
        "---",
        "",
      ].join("\n");
      writeFileSync(join(OUT, "markdown", `${p.slug}.md`), fm + (p.content || p.excerpt || ""));
    }
  }
}

console.log(`Done -> ${OUT}`);
