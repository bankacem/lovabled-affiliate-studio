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
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    console.log("[useBlogPosts] Fetching all published posts...");

    try {
      const { data: dbPosts, error: dbError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (dbError) {
        console.error("[useBlogPosts] Supabase fetch error:", dbError);
        setError(dbError.message);
      }

      // Merge with static data to bypass date filtering and ensure 2026 articles are visible
      const dbPostsList = dbPosts || [];

      // Use normalized slugs (lowercase + hyphens) for more robust deduplication
      const normalizeSlug = (s: string) => s.toLowerCase().replace(/_/g, '-');
      const dbNormalizedSlugs = new Set(dbPostsList.map(p => normalizeSlug(p.slug)));

      const missingStaticPosts = blogPosts.filter(p => !dbNormalizedSlugs.has(normalizeSlug(p.slug)));

      console.log(`[useBlogPosts] DB posts: ${dbPostsList.length}, Missing static posts: ${missingStaticPosts.length}`);

      const allPosts = [...dbPostsList, ...missingStaticPosts].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA; // Newest first
      });

      setPosts(allPosts as BlogPost[]);
    } catch (err) {
      console.error("[useBlogPosts] Unexpected error:", err);
      // Fallback to just static data on major error
      setPosts(blogPosts as unknown as BlogPost[]);
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
    const cleanSlug = rawSlug.toLowerCase().trim();
    setIsLoading(true);
    setError(null);

    try {
      // Stage 1: Exact slug match
      console.log(`[useBlogPost] Attempting exact slug match for: ${cleanSlug}`);
      const { data: exactMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (exactMatch) {
        setPost(exactMatch as BlogPost);
        setIsLoading(false);
        return;
      }

      // Stage 2: ID match (if it looks like a UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
      if (isUUID) {
        console.log(`[useBlogPost] Slug looks like UUID, attempting ID match: ${cleanSlug}`);
        const { data: idMatch } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", cleanSlug)
          .maybeSingle();

        if (idMatch) {
          setPost(idMatch as BlogPost);
          setIsLoading(false);
          return;
        }
      }

      // Stage 3: Fuzzy slug match (hyphens vs underscores)
      // This handles legacy data where slugs might have used underscores instead of hyphens
      const fuzzySlug = cleanSlug.includes("-")
        ? cleanSlug.replace(/-/g, "_")
        : cleanSlug.replace(/_/g, "-");

      if (fuzzySlug !== cleanSlug) {
        console.log(`[useBlogPost] Attempting fuzzy slug match: ${fuzzySlug}`);
        const { data: fuzzyMatch } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", fuzzySlug)
          .maybeSingle();

        if (fuzzyMatch) {
          setPost(fuzzyMatch as BlogPost);
          setIsLoading(false);
          return;
        }
      }

      // Stage 4: Case-insensitive fallback (using ilike)
      // Only run this if the previous exact/fuzzy matches failed
      console.log(`[useBlogPost] Attempting case-insensitive match for: ${cleanSlug}`);
      const { data: caseInsensitiveMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", cleanSlug)
        .maybeSingle();

      if (caseInsensitiveMatch) {
        setPost(caseInsensitiveMatch as BlogPost);
        setIsLoading(false);
        return;
      }

      // Stage 5: Static Fallback
      console.log(`[useBlogPost] No DB match found. Checking static fallback for: ${cleanSlug}`);
      const staticMatch = blogPosts.find(p =>
        p.slug.toLowerCase() === cleanSlug ||
        p.id === cleanSlug ||
        p.slug.toLowerCase() === fuzzySlug
      );

      if (staticMatch) {
        setPost(staticMatch as BlogPost);
        setIsLoading(false);
        return;
      }

      setPost(null);
    } catch (err) {
      console.error("[useBlogPost] Unexpected error fetching post:", err);
      const errorMessage = err instanceof Error ? err.message : "Post not found";
      // Final desperation fallback to static data
      const staticMatch = blogPosts.find(p => p.slug.toLowerCase() === cleanSlug);
      if (staticMatch) setPost(staticMatch as BlogPost);
      else setError(errorMessage);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("name")
      .order("name");

    if (data) {
      setCategories(["All", ...data.map(c => c.name)]);
    }
    setIsLoading(false);
  };

  return { categories, isLoading };
}
