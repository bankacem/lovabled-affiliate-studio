import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { blogPosts } from "@/data/blogPosts";

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
  return s.toLowerCase().trim().replace(/[_\s]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Enrich post with fallback SEO fields ─────────────────────────────────
function enrichPost(post: any): BlogPost {
  const safeTitle = post?.title || "Untitled Post";
  const safeSlug  = post?.slug  || "no-slug";
  return {
    ...post,
    title:            safeTitle,
    slug:             safeSlug,
    meta_title:       post?.meta_title       || `${safeTitle} | AIPrintVerse`,
    meta_description: post?.meta_description || post?.excerpt ||
                      (post?.content ? post.content.replace(/<[^>]*>/g, "").slice(0, 160) : ""),
    canonical_url:    post?.canonical_url    || `/blog/${safeSlug}`,
    tags:             Array.isArray(post?.tags) ? post.tags : [],
    status:           post?.status           || "draft",
    published_at:     post?.published_at     || post?.created_at || new Date().toISOString(),
  } as BlogPost;
}

// ─── Normalised cache of static seed articles ────────────────────────────
const normalizedStaticPosts = new Map(
  blogPosts.map((p) => [normalizeSlug(p.slug), p])
);

const LIST_COLS = [
  "id","title","slug","excerpt","featured_image","author_name",
  "category","tags","status","read_time","meta_title","meta_description",
  "published_at","created_at","updated_at",
].join(", ");

const FULL_COLS = `${LIST_COLS}, content`;

interface UseBlogPostsOptions {
  includeContent?: boolean;
  limit?: number;
  /** When true (public blog page) only show published.
   *  When false (admin) show ALL statuses. Default: true */
  publicOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// useBlogPosts — list of posts
// ═══════════════════════════════════════════════════════════════════════════
export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { includeContent = false, limit, publicOnly = true } = options;

  const [posts, setPosts]       = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // No Supabase → fall back to static seed data
      if (!supabase || typeof supabase.from !== "function") {
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
        return;
      }

      let query = supabase
        .from("blog_posts")
        .select(includeContent ? FULL_COLS : LIST_COLS)
        .order("published_at", { ascending: false });

      // FIX: public blog page shows only published articles;
      //      admin views (publicOnly=false) see everything.
      if (publicOnly) {
        query = query.eq("status", "published");
      }

      if (typeof limit === "number") {
        query = query.limit(limit);
      }

      const { data: dbPosts, error: dbError } = await query;

      if (dbError) {
        setError(dbError.message);
        // Fall back to static data on error
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
        return;
      }

      const list = (dbPosts || []).map((p) => enrichPost(p as any));

      if (list.length === 0) {
        // Nothing in DB yet — show static seed articles so page isn't empty
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
      } else {
        setPosts(list);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setPosts(blogPosts.map((p) => enrichPost(p as any)));
    } finally {
      setIsLoading(false);
    }
  }, [includeContent, limit, publicOnly]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
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

    // ── Phase 1: exact hit in static seed data ─────────────────────────
    const staticHit = normalizedStaticPosts.get(cleanSlug);
    if (staticHit) {
      setPost(enrichPost(staticHit as any));
      setIsLoading(false);
      return;
    }

    // ── Phase 1b: partial match in static data ──────────────────────────
    for (const [, sp] of normalizedStaticPosts) {
      const ns = normalizeSlug(sp.slug);
      if (ns.includes(cleanSlug) || cleanSlug.includes(ns)) {
        setPost(enrichPost(sp as any));
        setIsLoading(false);
        return;
      }
    }

    if (!supabase || typeof supabase.from !== "function") {
      setPost(null);
      setError("Article not found");
      setIsLoading(false);
      return;
    }

    try {
      // ── Phase 2: exact slug match (normalised) ───────────────────────
      const { data: exact } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (exact) { setPost(enrichPost(exact)); setIsLoading(false); return; }

      // ── Phase 3: original slug (before normalisation) ────────────────
      const { data: original } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
        .eq("slug", rawSlug)
        .maybeSingle();
      if (original) { setPost(enrichPost(original)); setIsLoading(false); return; }

      // ── Phase 4: UUID lookup ─────────────────────────────────────────
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);
      if (isUUID) {
        const { data: byId } = await supabase
          .from("blog_posts")
          .select(FULL_COLS)
          .eq("id", rawSlug)
          .maybeSingle();
        if (byId) { setPost(enrichPost(byId)); setIsLoading(false); return; }
      }

      // ── Phase 5: fuzzy ILIKE search ──────────────────────────────────
      // FIX: search across ALL statuses, not just published.
      // A draft article visited directly should still render for the owner.
      const { data: similar } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
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
      setPost(null);
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
      if (!supabase || typeof supabase.from !== "function") {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("blog_categories")
        .select("name")
        .order("name");
      if (data) setCategories(["All", ...data.map((c) => c.name)]);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return { categories, isLoading };
}
