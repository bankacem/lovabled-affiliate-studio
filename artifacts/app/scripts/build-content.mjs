// Turns /content/blog/*.md into static JSON the app fetches at runtime:
//   public/blog-index.json      -> lightweight list of live articles (no bodies)
//   public/blog-stats.json       -> lightweight Git-derived admin statistics
//   public/article/<slug>.json  -> full live article
// Runs before `vite build` and before `dev`, so the site never needs a database.

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPosts, toListItem } from "./content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const publicDir = resolve(appRoot, "public");
const outDir = resolve(publicDir, "article");

const posts = loadPosts();
const allPosts = loadPosts({ includeDrafts: true });

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean))).sort();

writeFileSync(
  resolve(publicDir, "blog-index.json"),
  JSON.stringify({ generated_at: new Date().toISOString(), total: posts.length, categories, posts: posts.map(toListItem) })
);

const categoryCounts = {};
for (const post of allPosts) {
  categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
}
writeFileSync(
  resolve(publicDir, "blog-stats.json"),
  JSON.stringify({
    generated_at: new Date().toISOString(),
    totalPosts: allPosts.length,
    publishedPosts: allPosts.filter((post) => post.status === "published").length,
    draftPosts: allPosts.filter((post) => post.status === "draft").length,
    scheduledPosts: allPosts.filter((post) => post.status === "scheduled").length,
    categoryCounts,
    recentPosts: allPosts.slice(0, 5).map((post) => ({
      title: post.title,
      status: post.status,
      created_at: post.created_at,
    })),
  }),
);

for (const post of posts) {
  writeFileSync(resolve(outDir, `${post.slug}.json`), JSON.stringify(post));
}

console.log(`[build-content] ${posts.length} live articles, ${allPosts.length} total Git articles, ${categories.length} categories`);
