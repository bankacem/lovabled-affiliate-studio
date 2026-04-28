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
function enrichPost(post: any): BlogPost {
  const safeTitle = post?.title || "Untitled Post";
  const safeSlug  = post?.slug  || "no-slug";
  const now = new Date().toISOString();

  // Ensure excerpt and category are never null for frontend robustness
  const safeExcerpt  = post?.excerpt  || "";
  const safeCategory = post?.category || "General";

  return {
    ...post,
    id:               post?.id               || `temp-${Math.random().toString(36).substring(2, 11)}`,
    title:            safeTitle,
    slug:             safeSlug,
    excerpt:          safeExcerpt,
    content:          post?.content          || "",
    featured_image:   post?.featured_image   || null,
    author_name:      post?.author_name      || "Admin",
    category:         safeCategory,
    tags:             Array.isArray(post?.tags) ? post.tags : [],
    status:           post?.status           || "draft",
    read_time:        post?.read_time        || "5 min read",
    meta_title:       post?.meta_title       || `${safeTitle} | AIPrintVerse`,
    meta_description: post?.meta_description || post?.excerpt ||
                      (post?.content ? post.content.replace(/<[^>]*>/g, "").slice(0, 160) : ""),
    canonical_url:    post?.canonical_url    || `/blog/${safeSlug}`,
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
        console.warn("Supabase client not available, falling back to static posts.");
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
        return;
      }

      // UPDATED: Temporarily select '*' to verify all data presence
      let query = supabase.from("blog_posts").select("*");

      // Defensive check for .order() method
      if (typeof query.order === "function") {
        query = query.order("created_at", { ascending: false });
      } else {
        console.error("Supabase query.order is not a function. Check client version.");
      }

      // FIX: public blog page shows only published articles;
      //      admin views (publicOnly=false) see everything.
      // UPDATED: Temporarily disabled status filter to verify 400+ articles
      /*
      if (publicOnly) {
        query = query.eq("status", "published");
      }
      */

      // UPDATED: Temporarily removed limit to see full dataset
      /*
      if (typeof limit === "number") {
        query = query.limit(limit);
      }
      */

      const { data: dbPosts, error: dbError } = await query;

      // LOG: Added diagnostic log as requested
      console.log('Total posts fetched from DB (list):', dbPosts?.length);

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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

    // ── Smart Redirect Fallback Logic ────────────────────────────────
    // If the slug contains "modern-co", it's likely a broken legacy link.
    if (cleanSlug.includes("modern-co")) {
      const { data: redirectMatch } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
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
        .select(FULL_COLS)
        .eq("slug", rawSlug)
        .maybeSingle();
      if (rawExact) { setPost(enrichPost(rawExact)); setIsLoading(false); return; }

      // ── Phase 1: Exact slug match (normalised) ───────────────────────
      const { data: exact } = await supabase
        .from("blog_posts")
        .select(FULL_COLS)
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (exact) { setPost(enrichPost(exact)); setIsLoading(false); return; }

      // ── Phase 2: UUID lookup ─────────────────────────────────────────
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

      // ── Phase 3: Fuzzy ILIKE search (all statuses) ───────────────────
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

      // ── Phase 4: Last resort — static seed data ──────────────────────
      // Only used when article exists in static data but not yet in DB.
      const staticHit = normalizedStaticPosts.get(cleanSlug);
      if (staticHit) {
        setPost(enrichPost(staticHit as any));
        setIsLoading(false);
        return;
      }

      // ── Not found ────────────────────────────────────────────────────
      setPost(null);
      setError("Article not found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      // Fallback to static data on error for robustness
      const staticHit = normalizedStaticPosts.get(cleanSlug);
      if (staticHit) {
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
