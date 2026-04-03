import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { blogPosts } from "@/data/blogPosts";
import { runSEOHealthCheck } from "@/lib/seoUtils";

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

      if (dbPosts && dbPosts.length > 0) {
        console.log("[useBlogPosts] DIAGNOSTIC - First 5 DB posts (slug/status/published_at):",
          dbPosts.slice(0, 5).map(p => ({ slug: p.slug, status: p.status, published_at: p.published_at }))
        );
      }

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

      const allPosts = [...dbPostsList, ...missingStaticPosts].map(post => {
        // Fallback logic for SEO metadata
        const meta_title = post.meta_title || `${post.title} | AIPrintVerse`;
        const meta_description = post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : "");
        const canonical_url = (post as any).canonical_url || `/blog/${post.slug}`;

        return {
          ...post,
          meta_title,
          meta_description,
          canonical_url
        };
      }).sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA; // Newest first
      });

      setPosts(allPosts as BlogPost[]);
    } catch (err) {
      console.error("[useBlogPosts] Unexpected error:", err);
      // Fallback to just static data on major error
      const fallbackPosts = blogPosts.map(post => ({
        ...post,
        meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
        meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
        canonical_url: post.canonical_url || `/blog/${post.slug}`
      }));
      setPosts(fallbackPosts as BlogPost[]);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Run SEO Health Check when posts are loaded (only in development)
  useEffect(() => {
    if (!isLoading && posts.length > 0 && process.env.NODE_ENV === "development") {
      runSEOHealthCheck(posts);
    }
  }, [posts, isLoading]);

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function useBlogPost(rawSlug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    const cleanSlug = rawSlug.toLowerCase().trim();
    console.log(`[useBlogPost] Fetching post for slug: "${cleanSlug}"`);
    setIsLoading(true);
    setError(null);

    try {
      // Direct exact match query - optimized for SEO and normalized slugs
      const { data: dbPost, error: dbError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (dbError) throw dbError;

      if (dbPost) {
        const post = dbPost as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: (post as any).canonical_url || `/blog/${post.slug}`
        });
      } else {
        // Fallback to static data
        const staticMatch = blogPosts.find(p => p.slug.toLowerCase() === cleanSlug);
        if (staticMatch) {
          const post = staticMatch as BlogPost;
          setPost({
            ...post,
            meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
            meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
            canonical_url: post.canonical_url || `/blog/${post.slug}`
          });
        } else {
          setPost(null);
        }
      }
    } catch (err) {
      console.error("[useBlogPost] Unexpected error fetching post:", err);
      setError(err instanceof Error ? err.message : "Post not found");

      // Desperation fallback to static
      const staticMatch = blogPosts.find(p => p.slug.toLowerCase() === cleanSlug);
      if (staticMatch) {
        const post = staticMatch as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: post.canonical_url || `/blog/${post.slug}`
        });
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
