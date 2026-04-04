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

// Helper: enrich post with fallback SEO metadata
function enrichPost(post: unknown): BlogPost {
  const p = post as Record<string, unknown>;
  const safeTitle = (p?.title as string) || "Untitled Post";
  const safeSlug = (p?.slug as string) || "no-slug";

  return {
    ...p,
    title: safeTitle,
    slug: safeSlug,
    meta_title: (p?.meta_title as string) || `${safeTitle} | AIPrintVerse`,
    meta_description:
      (p?.meta_description as string) ||
      (p?.excerpt as string) ||
      (p?.content ? (p.content as string).replace(/<[^>]*>/g, "").slice(0, 160) : "No description available"),
    canonical_url: (p?.canonical_url as string) || `/blog/${safeSlug}`,
    tags: Array.isArray(p?.tags) ? p.tags : [],
    status: (p?.status as string) || "draft",
    published_at: (p?.published_at as string) || (p?.created_at as string) || new Date().toISOString(),
  } as BlogPost;
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error("Supabase client not initialized");
      }

      const { data: dbPosts, error: dbError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (dbError) {
        setError(dbError.message);
      }

      const dbPostsList = dbPosts || [];

      const normalizeSlug = (s: string) => s.toLowerCase().replace(/[_\s]+/g, "-");
      const dbNormalizedSlugs = new Set(dbPostsList.map((p) => normalizeSlug(p.slug)));
      const missingStaticPosts = blogPosts.filter(
        (p) => !dbNormalizedSlugs.has(normalizeSlug(p.slug))
      );

      const allPosts = [...dbPostsList, ...missingStaticPosts]
        .map((post) => enrichPost(post))
        .sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at).getTime();
          const dateB = new Date(b.published_at || b.created_at).getTime();
          return dateB - dateA;
        });

      if (allPosts.length === 0) {
        setPosts(blogPosts.map((p) => enrichPost(p)));
      } else {
        setPosts(allPosts);
      }
    } catch (err) {
      // Fallback to static data on major error
      setPosts(blogPosts.map((p) => enrichPost(p)));
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function useBlogPost(rawSlug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!rawSlug) return;
    setIsLoading(true);
    setError(null);

    // Normalize slug: lowercase + replace underscores/spaces with hyphens
    const cleanSlug = rawSlug.toLowerCase().trim().replace(/[_\s]+/g, "-");

    // Stage 0: Instant static fallback for immediate UI response
    const staticMatch = blogPosts.find(
      (p) => p.slug.toLowerCase().replace(/[_\s]+/g, "-") === cleanSlug
    );
    if (staticMatch) {
      setPost(enrichPost(staticMatch));
      setIsLoading(false);
    }

    try {
      if (!supabase || typeof supabase.from !== 'function') {
        return;
      }

      // Stage 1: Direct DB lookup by normalized slug (primary path)
      const { data: exactMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (exactMatch) {
        setPost(enrichPost(exactMatch));
        setIsLoading(false);
        return;
      }

      // Stage 2: UUID fallback (for legacy links)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
      if (isUUID) {
        const { data: idMatch } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", cleanSlug)
          .maybeSingle();
        if (idMatch) {
          setPost(enrichPost(idMatch));
          setIsLoading(false);
          return;
        }
      }

      // Stage 3: If no DB match and no static match already set
      if (!staticMatch) {
        setPost(null);
      }
    } catch (err) {
      if (!staticMatch) {
        setError(err instanceof Error ? err.message : "Post not found");
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawSlug]);

  useEffect(() => {
    if (!rawSlug) return;
    fetchPost();
  }, [rawSlug, fetchPost]);

  return { post, isLoading, error };
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase || typeof supabase.from !== 'function') {
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
    fetchCategories();
  }, []);

  return { categories, isLoading };
}
