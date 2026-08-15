// Turns /content/blog/*.md into static JSON the app fetches at runtime:
//   public/blog-index.json      -> lightweight list (no bodies)
//   public/blog/<slug>.json     -> full article
// Runs before `vite build` and before `dev`, so the site never needs a database.

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, toListItem } from "./content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const publicDir = resolve(appRoot, "public");
const outDir = resolve(publicDir, "blog");

const posts = loadPosts();

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort();

writeFileSync(
  resolve(publicDir, "blog-index.json"),
  JSON.stringify({ generated_at: new Date().toISOString(), total: posts.length, categories, posts: posts.map(toListItem) })
);

for (const post of posts) {
  writeFileSync(resolve(outDir, `${post.slug}.json`), JSON.stringify(post));
}

console.log(`[build-content] ${posts.length} articles, ${categories.length} categories`);
