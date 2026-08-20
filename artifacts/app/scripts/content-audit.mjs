import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./content.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, "..");
const repoRoot = resolve(appRoot, "../..");
const defaultSources = {
  content_blog: resolve(repoRoot, "content/blog"),
  seoagent_content: resolve(repoRoot, ".seoagent/content"),
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff\s-]+/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-?p-/, "")
    .slice(0, 160);
}

export function normalizeTitle(value) {
  return normalizeText(value);
}

export function contentHash(value) {
  const normalized = String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function parseFile(filePath, root) {
  const raw = readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(raw);
  const headingMatch = raw.match(/^#\s+(.+)$/m);
  const title = String(data.title || headingMatch?.[1] || "").trim();
  const slug = normalizeSlug(data.slug || basename(filePath, ".md"));
  const hasFrontmatter = raw.trimStart().startsWith("---");
  const format = hasFrontmatter ? "frontmatter" : title ? "legacy-heading" : "invalid";
  return {
    path: filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath,
    absolutePath: filePath,
    slug,
    title,
    titleKey: normalizeTitle(title),
    bodyHash: contentHash(body),
    status: String(data.status || "").trim() || "published",
    date: String(data.date || "").trim(),
    updated: String(data.updated || data.last_modified || "").trim(),
    category: String(data.category || "").trim(),
    hasFrontmatter,
    format,
    bytes: Buffer.byteLength(raw, "utf8"),
  };
}

export function readArticleDirectory(directory, label = directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parseFile(join(directory, name), directory))
    .map((article) => ({ ...article, source: label }));
}

function groupBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = item[key];
    if (!value) continue;
    const list = groups.get(value) || [];
    list.push(item);
    groups.set(value, list);
  }
  return groups;
}

export function buildArticleIndex(articles) {
  return {
    bySlug: groupBy(articles, "slug"),
    byTitle: groupBy(articles, "titleKey"),
    byBodyHash: groupBy(articles, "bodyHash"),
  };
}

export function checkDuplicate(candidate, articles) {
  const normalized = {
    ...candidate,
    slug: normalizeSlug(candidate.slug || candidate.title),
    titleKey: normalizeTitle(candidate.title),
    bodyHash: contentHash(candidate.body || candidate.content || ""),
  };
  const index = buildArticleIndex(articles);
  const sameSlug = index.bySlug.get(normalized.slug) || [];
  const sameTitle = index.byTitle.get(normalized.titleKey) || [];
  const sameBody = index.byBodyHash.get(normalized.bodyHash) || [];

  if (sameSlug.some((item) => item.bodyHash === normalized.bodyHash)) {
    return { status: "already_exists", normalized, matches: sameSlug };
  }
  if (sameSlug.length) {
    return { status: "conflict", normalized, matches: sameSlug };
  }
  if (sameBody.length) {
    return { status: "duplicate_content", normalized, matches: sameBody };
  }
  if (sameTitle.length) {
    return { status: "duplicate_title", normalized, matches: sameTitle };
  }
  return { status: "new", normalized, matches: [] };
}

function compareSources(left, right) {
  const leftIndex = buildArticleIndex(left);
  const rightIndex = buildArticleIndex(right);
  const sameSlug = [];
  const sameTitle = [];
  const sameBody = [];

  for (const [slug, leftItems] of leftIndex.bySlug) {
    for (const leftItem of leftItems) {
      for (const rightItem of rightIndex.bySlug.get(slug) || []) {
        sameSlug.push({ slug, left: leftItem, right: rightItem, bodySame: leftItem.bodyHash === rightItem.bodyHash });
      }
    }
  }
  for (const [title, leftItems] of leftIndex.byTitle) {
    for (const leftItem of leftItems) {
      for (const rightItem of rightIndex.byTitle.get(title) || []) {
        sameTitle.push({ titleKey: title, left: leftItem, right: rightItem, bodySame: leftItem.bodyHash === rightItem.bodyHash });
      }
    }
  }
  for (const [hash, leftItems] of leftIndex.byBodyHash) {
    for (const leftItem of leftItems) {
      for (const rightItem of rightIndex.byBodyHash.get(hash) || []) {
        sameBody.push({ bodyHash: hash, left: leftItem, right: rightItem });
      }
    }
  }

  return {
    leftCount: left.length,
    rightCount: right.length,
    sameSlug,
    sameTitle,
    sameBody,
    leftOnlySlugs: [...leftIndex.bySlug.keys()].filter((slug) => !rightIndex.bySlug.has(slug)),
    rightOnlySlugs: [...rightIndex.bySlug.keys()].filter((slug) => !leftIndex.bySlug.has(slug)),
    leftDuplicateSlugs: [...leftIndex.bySlug].filter(([, items]) => items.length > 1),
    rightDuplicateSlugs: [...rightIndex.bySlug].filter(([, items]) => items.length > 1),
    leftInvalid: left.filter((item) => item.format === "invalid" || !item.slug || !item.title),
    rightInvalid: right.filter((item) => item.format === "invalid" || !item.slug || !item.title),
  };
}

export function runAudit(sources = defaultSources) {
  const left = readArticleDirectory(sources.content_blog, "content_blog");
  const right = readArticleDirectory(sources.seoagent_content, "seoagent_content");
  const comparison = compareSources(left, right);
  return {
    generatedAt: new Date().toISOString(),
    sources: {
      content_blog: { directory: sources.content_blog, count: left.length },
      seoagent_content: { directory: sources.seoagent_content, count: right.length },
    },
    comparison,
  };
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function markdownReport(report) {
  const c = report.comparison;
  const lines = [
    "# Content audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "This report is read-only. It does not modify or delete article files.",
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| content/blog files | ${report.sources.content_blog.count} |`,
    `| .seoagent/content files | ${report.sources.seoagent_content.count} |`,
    `| same slug pairs | ${c.sameSlug.length} |`,
    `| same slug with identical body | ${c.sameSlug.filter((x) => x.bodySame).length} |`,
    `| same slug with different body | ${c.sameSlug.filter((x) => !x.bodySame).length} |`,
    `| same title pairs | ${c.sameTitle.length} |`,
    `| same body hash pairs | ${c.sameBody.length} |`,
    `| content/blog duplicate slugs | ${c.leftDuplicateSlugs.length} |`,
    `| seoagent duplicate slugs | ${c.rightDuplicateSlugs.length} |`,
    `| content/blog invalid records | ${c.leftInvalid.length} |`,
    `| seoagent invalid records | ${c.rightInvalid.length} |`,
    "",
    "## Same-slug conflicts",
    "",
    "| Slug | content/blog | .seoagent/content | Result |",
    "|---|---|---|---|",
  ];
  for (const item of c.sameSlug) {
    lines.push(`| \`${item.slug}\` | \`${item.left.path}\` | \`${item.right.path}\` | ${item.bodySame ? "identical" : "different body"} |`);
  }
  if (!c.sameSlug.length) lines.push("| — | — | — | none |\n");
  lines.push("", "## Decision", "", "`content/blog` is the authoritative source for the current build. Same-slug records with different bodies are conflicts and must not be merged automatically.", "");
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runAudit();
  const jsonPath = argValue("--json");
  const markdownPath = argValue("--markdown");
  if (jsonPath) writeFileSync(resolve(process.cwd(), jsonPath), JSON.stringify(report, null, 2) + "\n");
  if (markdownPath) writeFileSync(resolve(process.cwd(), markdownPath), markdownReport(report));
  console.log(JSON.stringify({
    contentBlog: report.sources.content_blog.count,
    seoagentContent: report.sources.seoagent_content.count,
    sameSlug: report.comparison.sameSlug.length,
    sameSlugDifferentBody: report.comparison.sameSlug.filter((x) => !x.bodySame).length,
    sameTitle: report.comparison.sameTitle.length,
    sameBody: report.comparison.sameBody.length,
    leftOnlySlugs: report.comparison.leftOnlySlugs.length,
    rightOnlySlugs: report.comparison.rightOnlySlugs.length,
    invalid: report.comparison.leftInvalid.length + report.comparison.rightInvalid.length,
  }, null, 2));
}
