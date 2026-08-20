import { supabase } from "@/integrations/supabase/client";

export const GITHUB_REPO = "bankacem/lovabled-affiliate-studio";
export const CONTENT_PATH = "content/blog";

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

export interface PullRequestResult {
  code: string;
  slug: string;
  pullRequest: {
    number: number;
    url: string;
    title: string;
    branch?: string;
  };
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export function slugify(value: string) {
  return value
    .normalize("NFKC")
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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload.error === "string" ? payload.error : `API request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function verifyToken(): Promise<{ login: string; canWrite: boolean }> {
  const result = await apiFetch<{ repo: string; branch: string; canCreatePullRequest: boolean }>("/content/github/status");
  return { login: result.repo, canWrite: result.canCreatePullRequest };
}

export async function loadArticle(slug: string): Promise<Article> {
  return apiFetch<Article>(`/content/articles/${encodeURIComponent(slug)}`);
}

export async function saveArticle(article: Article): Promise<PullRequestResult> {
  return apiFetch<PullRequestResult>("/content/articles/pull-request", {
    method: "POST",
    body: JSON.stringify({ article }),
  });
}

export async function deleteArticle(slug: string): Promise<PullRequestResult> {
  return apiFetch<PullRequestResult>(`/content/articles/${encodeURIComponent(slug)}/pull-request`, {
    method: "DELETE",
  });
}

export async function listRepoArticles(): Promise<string[]> {
  const data = await apiFetch<Array<{ slug: string }>>("/content/articles");
  return data.map((item) => item.slug);
}

export { toBase64 };
