// One-time migration: converts the exported article archive (messy markdown with
// duplicated frontmatter/JSON-LD blocks) into clean content files at content/blog/<slug>.md
//
// Usage: node scripts/migrate-export-to-content.mjs <exportContentDir> [outDir]

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const SRC = process.argv[2] || "/tmp/zz/content";
const OUT = process.argv[3] || "content/blog";

mkdirSync(OUT, { recursive: true });

function yamlBlocks(text) {
  const out = [];
  const re = /```yaml\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function parseSimpleYaml(block) {
  const obj = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    obj[m[1]] = v;
  }
  return obj;
}

function q(v) {
  return JSON.stringify(v == null ? "" : String(v));
}

const files = readdirSync(SRC).filter((f) => f.endsWith(".md"));
let written = 0;
const skipped = [];

for (const file of files) {
  const raw = readFileSync(join(SRC, file), "utf8");
  const slug = basename(file, ".md");

  const blocks = yamlBlocks(raw);
  if (!blocks.length) { skipped.push(slug); continue; }
  // The last yaml block is the most accurate record for this post.
  const fm = parseSimpleYaml(blocks[blocks.length - 1]);

  // Body = everything after the LAST "محتوى المقالة" heading.
  const marker = "## 📋 محتوى المقالة";
  const idx = raw.lastIndexOf(marker);
  let body = idx === -1 ? "" : raw.slice(idx + marker.length).trim();
  body = body.replace(/^-+\s*/, "").trim();

  if (!body) { skipped.push(slug); continue; }

  const front = [
    "---",
    `title: ${q(fm.title || slug)}`,
    `slug: ${q(slug)}`,
    `description: ${q(fm.description || "")}`,
    `category: ${q(fm.article_type || "General")}`,
    `tags: []`,
    `author: ${q(fm.author || "AIPrintVerse Team")}`,
    `image: ${q(fm.featured_image || "")}`,
    `image_alt: ${q(fm.featured_image_alt || fm.title || "")}`,
    `date: ${q((fm.date || "").slice(0, 10))}`,
    `updated: ${q((fm.last_modified || fm.date || "").slice(0, 10))}`,
    `status: "published"`,
    `scheduled_at: ""`,
    `read_time: ${q(fm.reading_time || "6 min read")}`,
    "---",
    "",
  ].join("\n");

  writeFileSync(join(OUT, `${slug}.md`), front + body + "\n");
  written++;
}

console.log(`Migrated ${written} articles -> ${OUT}`);
if (skipped.length) console.log(`Skipped (no body): ${skipped.length}`, skipped.slice(0, 10));
