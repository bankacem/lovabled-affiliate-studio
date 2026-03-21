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

      if (dbError) {
        console.error("[useBlogPosts] Supabase fetch error:", dbError);
        setError(dbError.message);
      }

      // Merge with static data, prioritizing static data (STRICT DATA SAFETY RULE)
      const dbPostsList = dbPosts || [];
      const normalizeSlug = (s: string) => s.toLowerCase().replace(/_/g, '-');

      const staticNormalizedSlugs = new Set(blogPosts.map(p => normalizeSlug(p.slug)));

      // Keep DB posts that are NOT in static data
      const extraDbPosts = dbPostsList.filter(p => !staticNormalizedSlugs.has(normalizeSlug(p.slug)));

      console.log(`[useBlogPosts] Static posts: ${blogPosts.length}, Extra DB posts: ${extraDbPosts.length}`);

      const allPosts = [...blogPosts, ...extraDbPosts].map(post => {
        // Fallback logic for SEO metadata
        const meta_title = post.meta_title || post.title;
        const meta_description = post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : "");
        const canonical_url = post.canonical_url || `/blog/${post.slug}`;

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
        meta_title: post.meta_title || post.title,
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
    if (!isLoading && posts.length > 0 && import.meta.env.DEV) {
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
    const fuzzySlug = cleanSlug.includes("-")
      ? cleanSlug.replace(/-/g, "_")
      : cleanSlug.replace(/_/g, "-");

    console.log(`[useBlogPost] Fetching for cleanSlug: "${cleanSlug}"`);
    setIsLoading(true);
    setError(null);

    // List of pilot articles that MUST prioritize static data for SEO improvements
    const pilotSlugs = [
      'the-ultimate-guide-to-v-neck-shirts-style-fit-and-fashion-mastery',
      'the-ultimate-guide-to-retro-designs-how-to-master-vintage-style-in-modern-fashion',
      'bachelorette-party-shirt-ideas-2026-the-ultimate-guide-to-trends-fabrics-and-custom-designs',
      '35-trendy-bachelorette-party-shirt-ideas-your-squad-will-actually-love-2024-guide'
    ];

    // Priority Static Check (STRICT DATA SAFETY RULE)
    const staticMatch = blogPosts.find(p =>
      p.slug.toLowerCase() === cleanSlug ||
      p.id === cleanSlug ||
      p.slug.toLowerCase() === fuzzySlug
    );

    const isPilot = pilotSlugs.includes(cleanSlug) || (staticMatch && pilotSlugs.includes(staticMatch.slug));

    if (staticMatch && isPilot) {
      console.log(`[useBlogPost] Pilot priority match found for ${cleanSlug}. Bypassing DB.`);
      const post = staticMatch as BlogPost;
      setPost({
        ...post,
        meta_title: post.meta_title || post.title,
        meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
        canonical_url: post.canonical_url || `/blog/${post.slug}`
      });
      setIsLoading(false);
      return; // Return immediately for pilot articles
    }

    if (staticMatch) {
      console.log(`[useBlogPost] Static fallback found for ${cleanSlug}`);
      const post = staticMatch as BlogPost;
      setPost({
        ...post,
        meta_title: post.meta_title || post.title,
        meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
        canonical_url: post.canonical_url || `/blog/${post.slug}`
      });
      // Continue to check DB for non-pilot articles
    }

    try {
      // Stage 1: Exact slug match in DB
      const { data: exactMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (exactMatch) {
        console.log(`[useBlogPost] DB exact match found for ${cleanSlug}`);
        const post = exactMatch as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || post.title,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: post.canonical_url || `/blog/${post.slug}`
        });
        setIsLoading(false);
        return;
      }

      // Stage 2: ID match (if it looks like a UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
      if (isUUID) {
        const { data: idMatch } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", cleanSlug)
          .maybeSingle();

        if (idMatch) {
          console.log(`[useBlogPost] DB ID match found for ${cleanSlug}`);
          const post = idMatch as BlogPost;
          setPost({
            ...post,
            meta_title: post.meta_title || post.title,
            meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
            canonical_url: post.canonical_url || `/blog/${post.slug}`
          });
          setIsLoading(false);
          return;
        }
      }

      // If we already set a static match in the fallback step, we're done (DB search failed)
      if (staticMatch) {
          setIsLoading(false);
          return;
      }

      setPost(null);
    } catch (err) {
      console.error("[useBlogPost] Unexpected error fetching post:", err);
      // Final fallback to static if not already done
      if (staticMatch) {
          setIsLoading(false);
      } else {
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
