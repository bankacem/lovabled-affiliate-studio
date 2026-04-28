import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { blogPosts } from "@/data/blogPosts";
import { slugify } from "@/lib/slugify";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  author_name: string;
  category: string;
  tags: string[];
  status: string;
  read_time: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url?: string | null;
  video_url?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Slug normalisation ────────────────────────────────────────────────────
function normalizeSlug(s: string): string {
  return slugify(s);
}

// ─── Enrich post with fallback SEO fields ─────────────────────────────────
// DATA AGNOSTIC: Ensures that even highly partial DB records can be rendered.
// Implements flexible column mapping and safe defaults to prevent UI crashes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichPost(post: any): BlogPost {
  const safeTitle = post?.title || "Untitled Post";
  const safeSlug  = post?.slug  || "no-slug";
  const now = new Date().toISOString();

  // Flexible column mapping for images and content
  const safeContent = post?.content || post?.body || post?.html_content || post?.post_content || "";
  const safeImage   = post?.featured_image || post?.image_url || post?.image || post?.imageUrl || post?.thumbnail || "";

  // Ensure excerpt and category are never null for frontend robustness
  // Fallback excerpt to a snippet of content if missing
  const safeExcerpt  = post?.excerpt || post?.summary ||
                      (safeContent ? safeContent.replace(/<[^>]*>/g, "").slice(0, 160).trim() : "");
  const safeCategory = post?.category || "General";

  return {
    id:               post?.id               || `temp-${Math.random().toString(36).substring(2, 11)}`,
    title:            safeTitle,
    slug:             safeSlug,
    excerpt:          safeExcerpt,
    content:          safeContent,
    featured_image:   safeImage,
    author_name:      post?.author_name      || "Admin",
    category:         safeCategory,
    tags:             Array.isArray(post?.tags) ? post.tags : [],
    status:           post?.status           || "draft",
    read_time:        post?.read_time        || "5 min read",
    meta_title:       post?.meta_title       || `${safeTitle} | AIPrintVerse`,
    meta_description: post?.meta_description || safeExcerpt,
    canonical_url:    post?.canonical_url    || `/blog/${safeSlug}`,
    video_url:        post?.video_url        || null,
    published_at:     post?.published_at     || post?.created_at || now,
    created_at:       post?.created_at       || now,
    updated_at:       post?.updated_at       || now,
  } as BlogPost;
}

// ─── Normalised cache of static seed articles ────────────────────────────
// NOTE: Used only as last-resort fallback when Supabase is unavailable.
const normalizedStaticPosts = new Map(
  blogPosts.map((p) => [normalizeSlug(p.slug), p])
);

interface UseBlogPostsOptions {
  includeContent?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  /** When true (public blog page) only show published.
   *  When false (admin) show ALL statuses. Default: true */
  publicOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// useBlogPosts — list of posts
// ═══════════════════════════════════════════════════════════════════════════
export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const {
    includeContent = false,
    limit,
    page,
    pageSize,
    category,
    search,
    publicOnly = true
  } = options;

  const [posts, setPosts]           = useState<BlogPost[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // No Supabase → fall back to static seed data
      if (!supabase || typeof supabase.from !== "function") {
        console.warn("Supabase client not available, falling back to static posts.");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
        setTotalCount(blogPosts.length);
        return;
      }

      // ── SAFE QUERY CHAINING ──────────────────────────────────────────
      // We explicitly check for method existence before calling to prevent
      // TypeErrors if the Supabase client returns a degraded object.
      let query = supabase.from("blog_posts").select("*", { count: 'exact' });

      if (publicOnly && typeof query.eq === "function") {
        query = query.eq("status", "published");
      }

      if (category && category !== "All" && typeof query.eq === "function") {
        query = query.eq("category", category);
      }

      if (search && typeof query.or === "function") {
        query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
      }

      if (typeof query.order === "function") {
        query = query.order("created_at", { ascending: false });
      }

      if (typeof page === "number" && typeof pageSize === "number" && typeof query.range === "function") {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else if (typeof limit === "number" && typeof query.limit === "function") {
        query = query.limit(limit);
      }

      const { data: dbPosts, error: dbError, count } = await query;

      if (dbError) {
        setError(dbError.message);
        // Fall back to static data ONLY if it's a connection/missing client error,
        // not if the database just returned 0 results.
        if (!dbPosts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPosts(blogPosts.map((p) => enrichPost(p as any)));
          setTotalCount(blogPosts.length);
        } else {
          setPosts([]);
          setTotalCount(0);
        }
        return;
      }

      // If we got a response from DB (even empty), we use it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (dbPosts || []).map((p) => enrichPost(p as any));
      setPosts(list);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      // Fallback only on hard exception
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPosts(blogPosts.map((p) => enrichPost(p as any)));
      setTotalCount(blogPosts.length);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, pageSize, category, search, publicOnly]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, totalCount, isLoading, error, refetch: fetchPosts };
}

// ═══════════════════════════════════════════════════════════════════════════
// useBlogPost — single post by slug
// ═══════════════════════════════════════════════════════════════════════════
export function useBlogPost(rawSlug: string) {
  const [post, setPost]         = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!rawSlug) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);

    const cleanSlug = normalizeSlug(rawSlug);

    // ── Smart Redirect Fallback Logic ────────────────────────────────
    // If the slug contains "modern-co", it's likely a broken legacy link.
    if (cleanSlug.includes("modern-co")) {
      const { data: redirectMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", "the-ultimate-guide-to-authenticating-vintage-how-to-tell-if-a-shirt-is-truly-old-or-just-a-modern-copy")
        .maybeSingle();
      if (redirectMatch) {
        setPost(enrichPost(redirectMatch));
        setIsLoading(false);
        return;
      }
    }

    // ── No Supabase → fall back to static seed data only ──────────────
    if (!supabase || typeof supabase.from !== "function") {
      const staticHit = normalizedStaticPosts.get(cleanSlug);
      if (staticHit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPost(enrichPost(staticHit as any));
      } else {
        setPost(null);
        setError("Article not found");
      }
      setIsLoading(false);
      return;
    }

    try {
      // ── Phase 0: Exact slug match (raw/un-normalised) ────────────────
      // Handles cases with long slugs or non-standard characters in DB.
      const { data: rawExact } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", rawSlug)
        .maybeSingle();
      if (rawExact) { setPost(enrichPost(rawExact)); setIsLoading(false); return; }

      // ── Phase 1: Exact slug match (normalised) ───────────────────────
      const { data: exact } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (exact) { setPost(enrichPost(exact)); setIsLoading(false); return; }

      // ── Phase 2: UUID lookup ─────────────────────────────────────────
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);
      if (isUUID) {
        const { data: byId } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", rawSlug)
          .maybeSingle();
        if (byId) { setPost(enrichPost(byId)); setIsLoading(false); return; }
      }

      // ── Phase 3: Fuzzy ILIKE search (all statuses) ───────────────────
      const { data: similar } = await supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", `%${cleanSlug}%`)
        .limit(1);
      if (similar?.[0]) {
        setPost(enrichPost(similar[0]));
        setIsLoading(false);
        return;
      }

      // ── Not found ────────────────────────────────────────────────────
      setPost(null);
      setError("Article not found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      // Fallback to static data ONLY on hard exception (e.g. network/Supabase down)
      const staticHit = normalizedStaticPosts.get(cleanSlug);
      if (staticHit) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPost(enrichPost(staticHit as any));
      } else {
        setPost(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawSlug]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  return { post, isLoading, error };
}

// ═══════════════════════════════════════════════════════════════════════════
// useBlogCategories
// ═══════════════════════════════════════════════════════════════════════════
export function useBlogCategories() {
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!supabase || typeof supabase.from !== "function") {
          setIsLoading(false);
          return;
        }

        let query = supabase.from("blog_categories").select("name");

        if (typeof query.order === "function") {
          query = query.order("name");
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching blog categories:", error);
        } else if (data) {
          setCategories(["All", ...data.map((c) => c.name)]);
        }
      } catch (err) {
        console.error("Unexpected error fetching categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { categories, isLoading };
}
