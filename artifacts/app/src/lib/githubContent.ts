// Direct GitHub commits for blog content. The repository is the single source
// of truth for articles: every save is a commit to content/blog/<slug>.md,
// which triggers a Vercel deploy and puts the article live. No database, no
// middle layer.

export const GITHUB_REPO = "bankacem/lovabled-affiliate-studio";
export const CONTENT_PATH = "content/blog";
const TOKEN_KEY = "aipv_github_token";

export interface ArticleFrontmatter {
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  image: string;
  image_alt: string;
  date: string;
  updated: string;
  status: "published" | "draft" | "scheduled";
  scheduled_at: string;
  read_time: string;
}

export interface Article extends ArticleFrontmatter {
  content: string;
  sha?: string;
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token.trim());
  else localStorage.removeItem(TOKEN_KEY);
}

function headers() {
  const token = getToken();
  if (!token) throw new Error("Add your GitHub token first (Settings tab).");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

// btoa() throws on non-Latin1 characters (Arabic titles, emojis…), so encode UTF-8 first.
function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

export function buildMarkdown(article: Article) {
  const q = (v: string) => JSON.stringify(v ?? "");
  const front = [
    "---",
    `title: ${q(article.title)}`,
    `slug: ${q(article.slug)}`,
    `description: ${q(article.description)}`,
    `category: ${q(article.category)}`,
    `tags: [${(article.tags || []).map((t) => q(t)).join(", ")}]`,
    `author: ${q(article.author || "AIPrintVerse Team")}`,
    `image: ${q(article.image)}`,
    `image_alt: ${q(article.image_alt || article.title)}`,
    `date: ${q(article.date)}`,
    `updated: ${q(new Date().toISOString().slice(0, 10))}`,
    `status: ${q(article.status)}`,
    `scheduled_at: ${q(article.scheduled_at || "")}`,
    `read_time: ${q(article.read_time || "6 min read")}`,
    "---",
    "",
  ].join("\n");
  return front + (article.content || "").trim() + "\n";
}

export function parseMarkdown(raw: string, fallbackSlug: string): Article {
  const empty: Article = {
    title: fallbackSlug, slug: fallbackSlug, description: "", category: "Guides", tags: [],
    author: "AIPrintVerse Team", image: "", image_alt: "", date: new Date().toISOString().slice(0, 10),
    updated: "", status: "published", scheduled_at: "", read_time: "6 min read", content: raw,
  };
  if (!raw.startsWith("---")) return empty;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return empty;
  const head = raw.slice(3, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, unknown> = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      data[m[1]] = inner ? inner.split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
    } else {
      try { data[m[1]] = JSON.parse(value); } catch { data[m[1]] = value.replace(/^"|"$/g, ""); }
    }
  }
  return { ...empty, ...(data as Partial<Article>), content: body, slug: (data.slug as string) || fallbackSlug };
}

async function ghFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: headers() });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

export async function verifyToken(): Promise<{ login: string; canWrite: boolean }> {
  const repo = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO}`);
  const user = await ghFetch("https://api.github.com/user").catch(() => ({ login: "token" }));
  return { login: user.login ?? "token", canWrite: Boolean(repo?.permissions?.push ?? true) };
}

export async function loadArticle(slug: string): Promise<Article> {
  const data = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CONTENT_PATH}/${slug}.md`);
  const article = parseMarkdown(fromBase64(data.content), slug);
  article.sha = data.sha;
  return article;
}

export async function saveArticle(article: Article, message?: string) {
  const path = `${CONTENT_PATH}/${article.slug}.md`;
  let sha = article.sha;
  if (!sha) {
    try {
      const existing = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`);
      sha = existing.sha;
    } catch { /* new file */ }
  }
  return ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: message || `content: ${sha ? "update" : "add"} ${article.slug}`,
      content: toBase64(buildMarkdown(article)),
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function deleteArticle(slug: string) {
  const path = `${CONTENT_PATH}/${slug}.md`;
  const existing = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`);
  return ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message: `content: remove ${slug}`, sha: existing.sha }),
  });
}

// Articles committed but not yet in the deployed static index (pending build).
export async function listRepoArticles(): Promise<string[]> {
  const data = await ghFetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${CONTENT_PATH}?per_page=1000`);
  return (Array.isArray(data) ? data : [])
    .filter((f: { name: string }) => f.name.endsWith(".md"))
    .map((f: { name: string }) => f.name.replace(/\.md$/, ""));
}
