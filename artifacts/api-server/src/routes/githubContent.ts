import { Router, type Request, type Response } from "express";
import { resolve } from "node:path";
import { requireSupabaseAdmin } from "../middleware/requireSupabaseAdmin.js";

const router = Router();
const GITHUB_API = "https://api.github.com";
const REPO = process.env.GITHUB_REPO || "bankacem/lovabled-affiliate-studio";
const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const CONTENT_PATH = process.env.GITHUB_CONTENT_PATH || "content/blog";
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 500;
const MAX_CONTENT = 1_500_000;
const VALID_STATUS = new Set(["draft", "scheduled", "published"]);

interface ArticlePayload {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  image?: string;
  image_alt?: string;
  date?: string;
  updated?: string;
  status?: "published" | "draft" | "scheduled";
  scheduled_at?: string;
  read_time?: string;
  content: string;
}

interface RepoFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
}

function configError(): string | null {
  return process.env.GITHUB_TOKEN ? null : "GITHUB_TOKEN is not configured on the API server";
}

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured on the API server");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "AIPrintVerse-Content-Studio",
  };
}

async function githubFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: { ...githubHeaders(), ...(init?.headers || {}) },
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 240)}`);
  }
  return data as T;
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function encodeBase64Utf8(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64Utf8(value: string): string {
  return Buffer.from(value.replace(/\n/g, ""), "base64").toString("utf8");
}

function normalizeSlug(value: string | string[]): string {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s-]+/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^p-/, "")
    .slice(0, 160);
}

function normalizeContent(value: string): string {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function parseFrontmatter(raw: string): { data: Record<string, string | string[]>; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  const data: Record<string, string | string[]> = {};
  for (const line of raw.slice(3, end).split("\n")) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[match[1]] = value.slice(1, -1).split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
    } else {
      data[match[1]] = value.replace(/^"|"$/g, "");
    }
  }
  return { data, body: raw.slice(end + 4).replace(/^\r?\n/, "") };
}

function quote(value: unknown): string {
  return JSON.stringify(value ?? "");
}

function buildMarkdown(article: ArticlePayload): string {
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const today = new Date().toISOString().slice(0, 10);
  return [
    "---",
    `title: ${quote(article.title)}`,
    `slug: ${quote(article.slug)}`,
    `description: ${quote(article.description || "")}`,
    `category: ${quote(article.category || "General")}`,
    `tags: [${tags.map(quote).join(", ")}]`,
    `author: ${quote(article.author || "AIPrintVerse Team")}`,
    `image: ${quote(article.image || "")}`,
    `image_alt: ${quote(article.image_alt || article.title)}`,
    `date: ${quote(article.date || today)}`,
    `updated: ${quote(article.updated || today)}`,
    `status: ${quote(article.status || "draft")}`,
    `scheduled_at: ${quote(article.scheduled_at || "")}`,
    `read_time: ${quote(article.read_time || "6 min read")}`,
    "---",
    "",
    article.content.trim(),
    "",
  ].join("\n");
}

function validateArticle(input: unknown): { article?: ArticlePayload; error?: string } {
  if (!input || typeof input !== "object") return { error: "article object is required" };
  const value = input as Record<string, unknown>;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const content = typeof value.content === "string" ? value.content : "";
  const slug = normalizeSlug(typeof value.slug === "string" ? value.slug : title);
  const status = typeof value.status === "string" ? value.status : "draft";
  if (!title) return { error: "title is required" };
  if (!slug) return { error: "slug is required" };
  if (!content.trim()) return { error: "content is required" };
  if (title.length > MAX_TITLE) return { error: `title must be <= ${MAX_TITLE} characters` };
  if (content.length > MAX_CONTENT) return { error: `content must be <= ${MAX_CONTENT} characters` };
  if (typeof value.description === "string" && value.description.length > MAX_DESCRIPTION) return { error: `description must be <= ${MAX_DESCRIPTION} characters` };
  if (!VALID_STATUS.has(status)) return { error: "status must be draft, scheduled, or published" };
  if (status === "scheduled" && (!value.scheduled_at || Number.isNaN(new Date(String(value.scheduled_at)).getTime()))) {
    return { error: "scheduled_at must be a valid date for scheduled articles" };
  }
  return {
    article: {
      title,
      slug,
      description: typeof value.description === "string" ? value.description.trim() : "",
      category: typeof value.category === "string" ? value.category.trim() : "General",
      tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 30) : [],
      author: typeof value.author === "string" ? value.author.trim() : "AIPrintVerse Team",
      image: typeof value.image === "string" ? value.image.trim() : "",
      image_alt: typeof value.image_alt === "string" ? value.image_alt.trim() : title,
      date: typeof value.date === "string" ? value.date : new Date().toISOString().slice(0, 10),
      updated: typeof value.updated === "string" ? value.updated : new Date().toISOString().slice(0, 10),
      status: status as ArticlePayload["status"],
      scheduled_at: typeof value.scheduled_at === "string" ? value.scheduled_at : "",
      read_time: typeof value.read_time === "string" ? value.read_time : "6 min read",
      content,
    },
  };
}

async function getRefSha(ref: string): Promise<string> {
  const data = await githubFetch<{ object?: { sha?: string } }>(`/repos/${REPO}/git/ref/heads/${encodeURIComponent(ref)}`);
  if (!data.object?.sha) throw new Error(`Git branch ${ref} was not found`);
  return data.object.sha;
}

async function getRepoFile(slug: string, ref = BASE_BRANCH): Promise<RepoFile | null> {
  const path = `${CONTENT_PATH}/${slug}.md`;
  try {
    const data = await githubFetch<RepoFile & { content: string }>(`/repos/${REPO}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
    return { ...data, content: decodeBase64Utf8(data.content) };
  } catch (error) {
    if (String(error).startsWith("Error: GitHub 404")) return null;
    throw error;
  }
}

async function createBranch(branch: string): Promise<void> {
  const sha = await getRefSha(BASE_BRANCH);
  await githubFetch(`/repos/${REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}

async function openPullRequest(article: ArticlePayload, existing: RepoFile | null, remove = false) {
  const safeSlug = normalizeSlug(article.slug);
  const branch = `content/${safeSlug}-${Date.now()}`;
  await createBranch(branch);
  const path = `${CONTENT_PATH}/${safeSlug}.md`;
  if (remove) {
    if (!existing) throw new Error("Article does not exist in GitHub");
    await githubFetch(`/repos/${REPO}/contents/${encodePath(path)}`, {
      method: "DELETE",
      body: JSON.stringify({ message: `content: remove ${safeSlug}`, sha: existing.sha, branch }),
    });
  } else {
    await githubFetch(`/repos/${REPO}/contents/${encodePath(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `${existing ? "content: update" : "content: add"} ${safeSlug}`,
        content: encodeBase64Utf8(buildMarkdown(article)),
        branch,
        ...(existing?.sha ? { sha: existing.sha } : {}),
      }),
    });
  }
  return githubFetch<{ number: number; html_url: string; title: string; head?: { ref?: string } }>(`/repos/${REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `${remove ? "Remove" : existing ? "Update" : "Add"} article: ${article.title}`,
      head: branch,
      base: BASE_BRANCH,
      body: remove
        ? `This Pull Request removes **${safeSlug}** from ${CONTENT_PATH}.\n\nCreated by AIPrintVerse Content Studio.`
        : `This Pull Request ${existing ? "updates" : "adds"} **${article.title}**.\n\nThe content was validated by Content Studio before opening this PR.`,
    }),
  });
}

router.get("/content/github/status", requireSupabaseAdmin, async (_req: Request, res: Response) => {
  const error = configError();
  if (error) { res.status(503).json({ error }); return; }
  try {
    const repo = await githubFetch<{ full_name: string; default_branch: string }>(`/repos/${REPO}`);
    res.json({ repo: repo.full_name, branch: repo.default_branch || BASE_BRANCH, canCreatePullRequest: true });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

router.get("/content/articles", requireSupabaseAdmin, async (_req: Request, res: Response) => {
  const error = configError();
  if (error) { res.status(503).json({ error }); return; }
  try {
    const files = await githubFetch<Array<{ name: string; path: string; sha: string }>>(
      `/repos/${REPO}/contents/${encodePath(CONTENT_PATH)}?ref=${encodeURIComponent(BASE_BRANCH)}`,
    );
    res.json(files.filter((file) => file.name.endsWith(".md")).map((file) => ({
      slug: file.name.replace(/\.md$/, ""),
      path: file.path,
      sha: file.sha,
    })));
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

router.get("/content/articles/:slug", requireSupabaseAdmin, async (req: Request, res: Response) => {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] || "" : req.params.slug;
  const slug = normalizeSlug(rawSlug);
  if (!slug) { res.status(400).json({ error: "Invalid slug" }); return; }
  try {
    const file = await getRepoFile(slug);
    if (!file?.content) { res.status(404).json({ error: "Article not found" }); return; }
    const parsed = parseFrontmatter(file.content);
    res.json({ ...parsed.data, slug, content: parsed.body, sha: file.sha });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

router.post("/content/articles/pull-request", requireSupabaseAdmin, async (req: Request, res: Response) => {
  const validated = validateArticle(req.body?.article);
  if (!validated.article) { res.status(400).json({ error: validated.error }); return; }
  if (configError()) { res.status(503).json({ error: configError() }); return; }
  try {
    const article = validated.article;
    const existing = await getRepoFile(article.slug);
    const oldBody = existing?.content ? parseFrontmatter(existing.content).body : "";
    if (existing && normalizeContent(oldBody) === normalizeContent(article.content)) {
      res.status(409).json({ error: "Article already exists with identical content", code: "already_exists", slug: article.slug });
      return;
    }
    const pr = await openPullRequest(article, existing);
    res.status(201).json({
      code: existing ? "update_pr_created" : "create_pr_created",
      slug: article.slug,
      pullRequest: { number: pr.number, url: pr.html_url, title: pr.title, branch: pr.head?.ref },
    });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

router.delete("/content/articles/:slug/pull-request", requireSupabaseAdmin, async (req: Request, res: Response) => {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] || "" : req.params.slug;
  const slug = normalizeSlug(rawSlug);
  if (!slug) { res.status(400).json({ error: "Invalid slug" }); return; }
  if (configError()) { res.status(503).json({ error: configError() }); return; }
  try {
    const existing = await getRepoFile(slug);
    if (!existing) { res.status(404).json({ error: "Article not found", code: "not_found" }); return; }
    const parsed = parseFrontmatter(existing.content || "");
    const pr = await openPullRequest({ title: String(parsed.data.title || slug), slug, content: parsed.body }, existing, true);
    res.status(201).json({ code: "delete_pr_created", slug, pullRequest: { number: pr.number, url: pr.html_url, title: pr.title, branch: pr.head?.ref } });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

export default router;
