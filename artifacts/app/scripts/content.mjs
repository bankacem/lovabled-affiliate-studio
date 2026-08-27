// Reads the GitHub-committed article files in /content/blog and turns them into
// post objects with the same shape the app already uses.
// This is the single source of truth for blog content — no database involved.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const CONTENT_DIR = resolve(__dirname, "../../../content/blog");

function unquote(v) {
  const t = v.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    try { return JSON.parse(t); } catch { return t.slice(1, -1); }
  }
  return t;
}

export function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const head = raw.slice(3, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const data = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner ? inner.split(",").map((s) => unquote(s)).filter(Boolean) : [];
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body };
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The article template owns the single page-level H1. Demote any H1 present
// in committed article HTML so the rendered page has one clear H1 while
// preserving the heading text as an H2 section heading.
function sanitizeArticleBody(body) {
  let sanitized = String(body || "");
  sanitized = sanitized.replace(/<h1(\s[^>]*)?>/gi, "<h2$1>");
  sanitized = sanitized.replace(/<\/h1>/gi, "</h2>");

  // Auto-linking must never inject anchor markup into JSON-LD strings. Remove
  // HTML tags from JSON-LD script payloads so legacy FAQ blocks become valid
  // JSON without changing their visible text.
  sanitized = sanitized.replace(
    /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (_match, open, payload, close) => `${open}${payload.replace(/<[^>]*>/g, "")}${close}`,
  );

  return sanitized;
}

function unwrapNestedAnchors(html) {
  const anchorTagRegex = /<\/?a\b[^>]*>/gi;
  const stack = [];
  const removals = [];

  for (const match of html.matchAll(anchorTagRegex)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (match[0][1] === "/") {
      const frame = stack.pop();
      if (frame?.remove) {
        removals.push([frame.openStart, frame.openEnd], [start, end]);
      }
      continue;
    }

    // HTML anchors cannot be nested. When legacy content contains nested
    // anchors, unwrap the outer anchors and preserve the innermost link.
    for (const frame of stack) frame.remove = true;
    stack.push({ openStart: start, openEnd: end, remove: false });
  }

  return removals
    .sort((a, b) => b[0] - a[0])
    .reduce((result, [start, end]) => result.slice(0, start) + result.slice(end), html);
}

function sanitizeInternalBlogLinks(content, canonicalSlugs) {
  const knownSlugs = new Set([...canonicalSlugs].map(String));
  const internalAnchorRegex = /<a(\s[^>]*?)href=(['"])\/blog\/([^'"]+)\2([^>]*)>((?:(?!<a\b)[\s\S])*?)<\/a>/gi;
  let sanitized = unwrapNestedAnchors(String(content || ""));

  // Process innermost anchors first so malformed nested anchors cannot hide
  // an invalid inner URL from the allowlist check.
  let previous;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(
      internalAnchorRegex,
      (_match, before, quote, rawSlug, after, inner) => {
        let decodedSlug = rawSlug;
        try {
          decodedSlug = decodeURIComponent(rawSlug);
        } catch {
          // Keep the raw slug; it will be removed if it is not in the allowlist.
        }

        const canonicalSlug = decodedSlug.replace(/^p-/, "");
        if (!knownSlugs.has(canonicalSlug)) return inner;

        return `<a${before}href=${quote}/blog/${canonicalSlug}${quote}${after}>${inner}</a>`;
      },
    );
  } while (sanitized !== previous);

  return sanitized;
}

function toPost(slug, raw) {
  const { data, body } = parseFrontmatter(raw);
  const date = data.date || "";
  const iso = (d) => {
    if (!d) return null;
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? null : t.toISOString();
  };
  const publishedAt = iso(date);
  const rawSlug = data.slug || slug;
  const canonicalSlug = String(rawSlug).replace(/^p-/, "");
  return {
    id: slug,
    slug: canonicalSlug,
    title: data.title || slug,
    content: sanitizeArticleBody(body),
    excerpt: data.description || stripHtml(body).slice(0, 200),
    meta_description: data.description || stripHtml(body).slice(0, 160),
    meta_title: data.meta_title || data.title || slug,
    featured_image: data.image || null,
    featured_image_alt: data.image_alt || data.title || slug,
    author_name: data.author || "AIPrintVerse Team",
    category: data.category || "General",
    tags: Array.isArray(data.tags) ? data.tags : [],
    read_time: data.read_time || "6 min read",
    status: data.status || "published",
    scheduled_at: data.scheduled_at || "",
    published_at: publishedAt,
    created_at: publishedAt || new Date().toISOString(),
    updated_at: iso(data.updated || date) || publishedAt || new Date().toISOString(),
  };
}

// A scheduled article whose time has come is treated as published at build time.
function isLive(post, now = Date.now()) {
  if (post.status === "published") return true;
  if (post.status === "scheduled" && post.scheduled_at) {
    const t = new Date(post.scheduled_at).getTime();
    return !Number.isNaN(t) && t <= now;
  }
  return false;
}

export function loadPosts({ includeDrafts = false } = {}) {
  if (!existsSync(CONTENT_DIR)) {
    console.warn(`[content] missing directory ${CONTENT_DIR}`);
    return [];
  }
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((f) => {
    const fileSlug = basename(f, ".md");
    const post = toPost(fileSlug, readFileSync(join(CONTENT_DIR, f), "utf8"));
    return { ...post, source_file: f, is_legacy_slug: fileSlug.startsWith("p-") };
  });
  // When both p-legacy.md and canonical.md exist, publish the canonical file
  // only. Keep the legacy file on disk for review and redirect old URLs to the
  // canonical route instead of deleting content automatically.
  const canonicalPosts = new Map();
  for (const post of posts) {
    const current = canonicalPosts.get(post.slug);
    if (!current || (current.is_legacy_slug && !post.is_legacy_slug)) canonicalPosts.set(post.slug, post);
  }
  const live = includeDrafts ? [...canonicalPosts.values()] : [...canonicalPosts.values()].filter((p) => isLive(p));
  const canonicalSlugs = new Set(live.map((post) => post.slug));
  const sanitized = live.map((post) => ({
    ...post,
    content: sanitizeInternalBlogLinks(post.content, canonicalSlugs),
  }));
  return sanitized.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
}

export function toListItem(p) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    meta_description: p.meta_description,
    featured_image: p.featured_image,
    author_name: p.author_name,
    category: p.category,
    tags: p.tags,
    read_time: p.read_time,
    status: "published",
    published_at: p.published_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}
