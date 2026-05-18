// Supabase replaced by custom Express API.
// This shim preserves all existing imports while we migrate components.
// Do not add new usages — use @workspace/api-client-react hooks directly.

const BASE = import.meta.env.BASE_URL;

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiRequest(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BASE}api${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers as Record<string, string> || {}) },
  });
}

// Write paths (POST/PATCH/DELETE) — used for mutations
const TABLE_WRITE_PATH: Record<string, string> = {
  designs: "/designs",
  blog_posts: "/blog/posts",
  blog_categories: "/blog/categories",
  page_views: "/analytics/pageview",
  link_tracking: "/analytics/link-tracking",
  auto_link_keywords: "/seo/auto-link-keywords",
  article_templates: "/seo/article-templates",
  generation_batches: "/seo/generation-batches",
  stores: "/stores",
  user_roles: "/auth/roles",
  ebooks: "/ebooks",
};

// Read paths (GET) — separate because analytics tables have different read vs write endpoints
const TABLE_READ_PATH: Record<string, string> = {
  ...TABLE_WRITE_PATH,
  page_views: "/analytics/page-views",
  link_tracking: "/analytics/link-tracking",
};

const TABLE_TO_PATH = TABLE_WRITE_PATH;

interface QueryResult {
  data: unknown;
  count?: number;
  error: unknown;
}

type QB = {
  select: (cols?: string, opts?: { count?: "exact" }) => QB;
  insert: (data: unknown) => QB;
  update: (data: unknown) => QB;
  upsert: (data: unknown, opts?: { onConflict?: string }) => QB;
  delete: () => QB;
  eq: (col: string, val: unknown) => QB;
  neq: (col: string, val: unknown) => QB;
  is: (col: string, val: unknown) => QB;
  in: (col: string, vals: unknown[]) => QB;
  gte: (col: string, val: unknown) => QB;
  lte: (col: string, val: unknown) => QB;
  gt: (col: string, val: unknown) => QB;
  lt: (col: string, val: unknown) => QB;
  not: (col: string, op: string, val: unknown) => QB;
  contains: (col: string, val: unknown) => QB;
  ilike: (col: string, val: string) => QB;
  order: (col: string, opts?: { ascending?: boolean }) => QB;
  limit: (n: number) => QB;
  range: (from: number, to: number) => QB;
  single: () => Promise<QueryResult>;
  maybeSingle: () => Promise<QueryResult>;
  then: (resolve: (v: QueryResult) => void, reject?: (e: unknown) => void) => Promise<void>;
};

function buildQB(table: string): QB {
  let _body: unknown = null;
  let _eqFilters: Array<[string, unknown]> = [];
  let _inFilter: [string, unknown[]] | null = null;
  let _limitN: number | null = null;
  let _rangeFrom: number | null = null;
  let _rangeTo: number | null = null;
  let _isSingle = false;
  let _isInsert = false;
  let _isUpdate = false;
  let _isUpsert = false;
  let _isDelete = false;

  const qb: QB = {
    select(_, opts) { if (opts?.count === "exact") { /* count returned from paginated responses */ } return qb; },
    insert(data) { _body = data; _isInsert = true; return qb; },
    update(data) { _body = data; _isUpdate = true; return qb; },
    upsert(data) { _body = data; _isUpsert = true; return qb; },
    delete() { _isDelete = true; return qb; },
    eq(col, val) { _eqFilters.push([col, val]); return qb; },
    neq() { return qb; },
    is(col, val) { _eqFilters.push([col, val]); return qb; },
    in(col, vals) { _inFilter = [col, vals]; return qb; },
    gte() { return qb; },
    lte() { return qb; },
    gt() { return qb; },
    lt() { return qb; },
    not() { return qb; },
    contains() { return qb; },
    ilike() { return qb; },
    order() { return qb; },
    limit(n) { _limitN = n; return qb; },
    range(from, to) { _rangeFrom = from; _rangeTo = to; return qb; },
    single() { _isSingle = true; return execute(); },
    maybeSingle() { _isSingle = true; return execute(); },
    then(resolve, reject) { return execute().then(resolve, reject); },
  };

  async function execute(): Promise<QueryResult> {
    try {
      const writePath = TABLE_TO_PATH[table] || `/${table}`;
      const readPath = TABLE_READ_PATH[table] || `/${table}`;
      const idFilter = _eqFilters.find(([col]) => col === "id");
      const statusFilter = _eqFilters.find(([col]) => col === "status");
      const slugFilter = _eqFilters.find(([col]) => col === "slug");
      const batchFilter = _eqFilters.find(([col]) => col === "generation_batch");
      const targetUrlFilter = _eqFilters.find(([col]) => col === "target_url");
      const sourcePostFilter = _eqFilters.find(([col]) => col === "source_post_id");

      // ── INSERT ────────────────────────────────────────────────────────────
      if (_isInsert) {
        const path = table === "page_views" ? "/analytics/pageview" : writePath;
        const res = await apiRequest(path, { method: "POST", body: JSON.stringify(_body) });
        const d = res.status === 204 ? null : await res.json();
        return { data: d, error: res.ok ? null : d };
      }

      // ── UPSERT ────────────────────────────────────────────────────────────
      // link_tracking upsert (Scan All Articles) → POST /analytics/link-tracking (preserves click_count)
      if (_isUpsert) {
        const res = await apiRequest(writePath, { method: "POST", body: JSON.stringify(_body) });
        const d = res.status === 204 ? null : await res.json();
        return { data: d, error: res.ok ? null : d };
      }

      // ── UPDATE ────────────────────────────────────────────────────────────
      if (_isUpdate) {
        // Batch update by generation_batch (+ optional status filter)
        if (batchFilter && table === "blog_posts") {
          const body: Record<string, unknown> = { ...(_body as Record<string, unknown>) };
          if (statusFilter) body.filter_status = statusFilter[1];
          const res = await apiRequest(`${writePath}/by-batch/${batchFilter[1]}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          });
          if (!res.ok) { const d = await res.json(); return { data: null, error: d }; }
          const d = await res.json();
          return { data: d, error: null };
        }
        // Batch update by explicit id array  (.in("id", [...]))
        if (_inFilter && _inFilter[0] === "id") {
          const ids = _inFilter[1] as string[];
          const res = await apiRequest(writePath, {
            method: "PATCH",
            body: JSON.stringify({ ids, data: _body }),
          });
          if (!res.ok) { const d = await res.json(); return { data: null, error: d }; }
          const d = await res.json();
          return { data: d, error: null };
        }
        // Single update by id
        if (idFilter) {
          const res = await apiRequest(`${writePath}/${idFilter[1]}`, {
            method: "PATCH",
            body: JSON.stringify(_body),
          });
          const d = await res.json();
          return { data: d, error: res.ok ? null : d };
        }
        // Unsupported update pattern — return explicit error so callers know
        const missingFilters = _eqFilters.map(([col]) => col).join(", ");
        return { data: null, error: { message: `[supabase-shim] update on ${table} with unsupported filter(s): ${missingFilters || "none"}` } };
      }

      // ── DELETE ────────────────────────────────────────────────────────────
      if (_isDelete) {
        // Delete all posts in a generation batch
        if (batchFilter && table === "blog_posts") {
          const res = await apiRequest(`${writePath}/by-batch/${batchFilter[1]}`, { method: "DELETE" });
          return { data: null, error: res.ok ? null : "Batch delete failed" };
        }
        // Batch delete by explicit id array (.in("id", [...]))
        if (_inFilter && _inFilter[0] === "id") {
          const ids = _inFilter[1] as string[];
          const results = await Promise.all(
            ids.map(id => apiRequest(`${writePath}/${id}`, { method: "DELETE" }))
          );
          const anyFailed = results.find(r => !r.ok);
          return { data: null, error: anyFailed ? "Some deletes failed" : null };
        }
        // Single delete by id
        if (idFilter) {
          const res = await apiRequest(`${writePath}/${idFilter[1]}`, { method: "DELETE" });
          return { data: null, error: res.ok ? null : "Delete failed" };
        }
        const missingFilters = _eqFilters.map(([col]) => col).join(", ");
        return { data: null, error: { message: `[supabase-shim] delete on ${table} with unsupported filter(s): ${missingFilters || "none"}` } };
      }

      // ── GET ───────────────────────────────────────────────────────────────

      // Slug existence check (.in("slug", slugs)) for duplicate detection
      if (_inFilter && _inFilter[0] === "slug" && table === "blog_posts") {
        const slugs = (_inFilter[1] as string[]).join(",");
        const res = await apiRequest(`/blog/posts/slugs-exist?slugs=${encodeURIComponent(slugs)}`);
        if (!res.ok) return { data: null, error: await res.json() };
        const d = await res.json();
        return { data: d, count: Array.isArray(d) ? d.length : 0, error: null };
      }

      // Fetch posts by generation_batch
      if (batchFilter && table === "blog_posts") {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", String(statusFilter[1]));
        if (_limitN) params.set("limit", String(_limitN));
        const qs = params.toString();
        const res = await apiRequest(`/blog/posts/by-batch/${batchFilter[1]}${qs ? "?" + qs : ""}`);
        if (!res.ok) return { data: null, error: await res.json() };
        const d = await res.json();
        return { data: d, count: Array.isArray(d) ? d.length : undefined, error: null };
      }

      // link_tracking existence check (.eq("target_url", ...).eq("source_post_id", ...).maybeSingle())
      // Used by ArticleOptimizer to check before inserting a new link tracking row
      if (table === "link_tracking" && targetUrlFilter) {
        const params = new URLSearchParams();
        params.set("target_url", String(targetUrlFilter[1]));
        if (sourcePostFilter) params.set("source_post_id", String(sourcePostFilter[1]));
        const res = await apiRequest(`/analytics/link-tracking/check?${params.toString()}`);
        if (!res.ok) return { data: null, error: await res.json() };
        const d = await res.json();
        return { data: d, error: null };
      }

      // Build standard GET path using readPath (handles analytics table routing)
      let path = readPath;
      if (slugFilter && table === "blog_posts") {
        path = `/blog/posts/slug/${slugFilter[1]}`;
      } else if (idFilter) {
        path = `${readPath}/${idFilter[1]}`;
      }

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", String(statusFilter[1]));
      if (_limitN) params.set("limit", String(_limitN));
      if (_rangeFrom !== null && _rangeTo !== null) {
        const ps = _rangeTo - _rangeFrom + 1;
        params.set("page", String(Math.floor(_rangeFrom / ps) + 1));
        params.set("pageSize", String(ps));
      }

      const qs = params.toString();
      const res = await apiRequest(`${path}${qs ? "?" + qs : ""}`);
      if (!res.ok) { return { data: null, error: await res.json() }; }

      const json = await res.json();

      // Unwrap paginated responses
      if (json && typeof json === "object" && !Array.isArray(json)) {
        if ("posts" in json) return { data: (json as any).posts, count: (json as any).total, error: null };
        if ("designs" in json) return { data: (json as any).designs, count: (json as any).total, error: null };
      }

      if (_isSingle) {
        const arr = Array.isArray(json) ? json : [json];
        return { data: arr[0] ?? null, error: null };
      }

      return { data: json, count: Array.isArray(json) ? json.length : undefined, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  return qb;
}

// Auth event bus
const _authListeners: Array<(event: string, session: unknown) => void> = [];

export const supabase = {
  from: (table: string) => buildQB(table),

  auth: {
    onAuthStateChange(cb: (event: string, session: unknown) => void) {
      _authListeners.push(cb);
      const token = localStorage.getItem("auth_token");
      if (token) {
        setTimeout(() => cb("SIGNED_IN", { user: { id: "user", email: "" } }), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              const i = _authListeners.indexOf(cb);
              if (i >= 0) _authListeners.splice(i, 1);
            },
          },
        },
      };
    },

    async getUser() {
      const token = localStorage.getItem("auth_token");
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await apiRequest("/auth/me");
        const user = await res.json();
        if (user.id === "anonymous") return { data: { user: null }, error: null };
        return { data: { user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },

    async getSession() {
      const token = localStorage.getItem("auth_token");
      if (!token) return { data: { session: null } };
      try {
        const res = await apiRequest("/auth/me");
        const user = await res.json();
        if (user.id === "anonymous") return { data: { session: null } };
        return { data: { session: { user } } };
      } catch {
        return { data: { session: null } };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const res = await apiRequest("/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      localStorage.setItem("auth_token", data.token);
      _authListeners.forEach(cb => cb("SIGNED_IN", { user: data.user }));
      return { data, error: null };
    },

    async signUp({ email, password }: { email: string; password: string; options?: Record<string, unknown> }) {
      const res = await apiRequest("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      localStorage.setItem("auth_token", data.token);
      _authListeners.forEach(cb => cb("SIGNED_IN", { user: data.user }));
      return { data, error: null };
    },

    async signOut() {
      localStorage.removeItem("auth_token");
      _authListeners.forEach(cb => cb("SIGNED_OUT", null));
      await apiRequest("/auth/signout", { method: "POST" }).catch(() => {});
      return { error: null };
    },
  },

  rpc: async (fn: string, args: Record<string, unknown>) => {
    if (fn === "has_role") {
      try {
        const res = await apiRequest("/auth/me");
        const user = await res.json();
        return { data: user.isAdmin && args._role === "admin", error: null };
      } catch {
        return { data: false, error: null };
      }
    }
    return { data: null, error: null };
  },

  functions: {
    async invoke(name: string, opts?: { body?: unknown }) {
      const fnMap: Record<string, string> = {
        "generate-article": "/ai/generate-article",
        "generate-article-openrouter": "/ai/generate-article",
        "generate-article-groq": "/ai/generate-article",
        "optimize-title": "/ai/optimize-title",
        "ai-internal-linking": "/ai/internal-linking",
        "seo-analytics": "/ai/seo-analytics",
        "serp-analysis": "/ai/serp-analysis",
        "search-unsplash": "/ai/search-images",
        "import-designs": "/ai/import-designs",
        "publish-scheduled-posts": "/ai/publish-scheduled",
        "sitemap": "/sitemap",
      };
      const path = fnMap[name];
      if (!path) return { data: null, error: { message: `Unknown function: ${name}` } };
      try {
        const res = await apiRequest(path, { method: "POST", body: JSON.stringify(opts?.body || {}) });
        const data = await res.json();
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  },
};
