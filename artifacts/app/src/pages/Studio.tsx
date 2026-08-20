import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, RefreshCw, Github, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  type Article,
  buildMarkdown,
  deleteArticle,
  listRepoArticles,
  loadArticle,
  saveArticle,
  slugify,
  verifyToken,
  GITHUB_REPO,
} from "@/lib/githubContent";

const today = () => new Date().toISOString().slice(0, 10);

const emptyArticle = (): Article => ({
  title: "",
  slug: "",
  description: "",
  category: "Guides",
  tags: [],
  author: "AIPrintVerse Team",
  image: "",
  image_alt: "",
  date: today(),
  updated: today(),
  status: "published",
  scheduled_at: "",
  read_time: "6 min read",
  content: "",
});

interface IndexPost {
  slug: string;
  title: string;
  category: string;
  published_at?: string | null;
}

export default function Studio() {
  const [account, setAccount] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [livePosts, setLivePosts] = useState<IndexPost[]>([]);
  const [repoSlugs, setRepoSlugs] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const [draft, setDraft] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/blog-index.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setLivePosts(d.posts ?? []))
      .catch(() => setLivePosts([]));
  }, []);

  useEffect(() => {
    void connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshRepo() {
    try {
      setRepoSlugs(await listRepoArticles());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function connect() {
    setChecking(true);
    try {
      const info = await verifyToken();
      setAccount(info.login);
      toast.success(`GitHub repository ready: ${info.login}`);
      await refreshRepo();
    } catch (e) {
      setAccount(null);
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  const rows = useMemo(() => {
    const liveMap = new Map(livePosts.map((p) => [p.slug, p]));
    const slugs = Array.from(new Set([...repoSlugs, ...livePosts.map((p) => p.slug)]));
    return slugs
      .map((slug) => ({
        slug,
        title: liveMap.get(slug)?.title ?? slug,
        category: liveMap.get(slug)?.category ?? "—",
        live: liveMap.has(slug),
      }))
      .filter((r) => !query || r.title.toLowerCase().includes(query.toLowerCase()) || r.slug.includes(query.toLowerCase()))
      .sort((a, b) => Number(a.live) - Number(b.live) || a.title.localeCompare(b.title))
      .slice(0, 200);
  }, [livePosts, repoSlugs, query]);

  async function openArticle(slug: string) {
    setBusy(true);
    try {
      setDraft(await loadArticle(slug));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    const slug = draft.slug || slugify(draft.title);
    if (!draft.title.trim() || !slug) {
      toast.error("Title is required.");
      return;
    }
    setBusy(true);
    try {
      const result = await saveArticle({ ...draft, slug });
      toast.success(`Pull Request #${result.pullRequest.number} created for review.`);
      if (result.pullRequest.url) window.open(result.pullRequest.url, "_blank", "noopener,noreferrer");
      setDraft(null);
      await refreshRepo();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(slug: string) {
    if (!window.confirm(`Delete ${slug}.md from GitHub?`)) return;
    setBusy(true);
    try {
      const result = await deleteArticle(slug);
      toast.success(`Delete Pull Request #${result.pullRequest.number} created for review.`);
      if (result.pullRequest.url) window.open(result.pullRequest.url, "_blank", "noopener,noreferrer");
      await refreshRepo();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const update = (patch: Partial<Article>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Content Studio | AIPrintVerse</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Content Studio</h1>
              <p className="text-xs text-muted-foreground">{GITHUB_REPO} · content/blog</p>
            </div>
          </div>
          {account && <Badge variant="secondary">{account}</Badge>}
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6">
        {/* Connection */}
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">GitHub publishing</p>
            <p className="text-xs text-muted-foreground">
              {account ? `Connected to ${account}. Saves create Pull Requests; nothing is committed directly from the browser.` : "Checking the protected GitHub publishing service…"}
            </p>
          </div>
          <Button variant="outline" onClick={connect} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {checking ? "Checking" : "Check connection"}
          </Button>
        </Card>

        {draft ? (
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">{draft.sha ? "Edit article" : "New article"}</h2>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
                <Button onClick={save} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Commit & publish
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    update({ title: e.target.value, slug: draft.sha ? draft.slug : slugify(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={draft.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} />
              </div>
              <div className="md:col-span-2">
                <Label>Meta description</Label>
                <Textarea rows={2} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={draft.category} onChange={(e) => update({ category: e.target.value })} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={(draft.tags || []).join(", ")}
                  onChange={(e) => update({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Featured image URL</Label>
                <Input value={draft.image} onChange={(e) => update({ image: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.status}
                  onChange={(e) => update({ status: e.target.value as Article["status"] })}
                >
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <Label>Publish at (for scheduled)</Label>
                <Input
                  type="datetime-local"
                  value={draft.scheduled_at ? draft.scheduled_at.slice(0, 16) : ""}
                  onChange={(e) => update({ scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                />
              </div>
            </div>

            <div>
              <Label>Content (HTML or Markdown)</Label>
              <Textarea
                rows={18}
                className="font-mono text-xs"
                value={draft.content}
                onChange={(e) => update({ content: e.target.value })}
              />
            </div>

            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Preview committed file</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted p-3">
                {buildMarkdown(draft).slice(0, 1500)}
              </pre>
            </details>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search articles" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={refreshRepo} disabled={checking || !account}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
                <Button onClick={() => setDraft(emptyArticle())}>
                  <Plus className="h-4 w-4" /> New article
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {livePosts.length} live on the site · {repoSlugs.length || "—"} files in GitHub
            </p>

            <Card className="divide-y divide-border">
              {rows.map((row) => (
                <div key={row.slug} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/{row.slug}</p>
                  </div>
                  <Badge variant={row.live ? "secondary" : "outline"}>{row.live ? row.category : "pending deploy"}</Badge>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/blog/${row.slug}`} target="_blank" rel="noreferrer" aria-label="View article">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openArticle(row.slug)} disabled={busy}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(row.slug)} disabled={busy}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No articles found.</p>}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
