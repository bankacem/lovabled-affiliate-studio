import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
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
      const dbSlugs = new Set(dbPostsList.map(p => p.slug.toLowerCase()));

      const missingStaticPosts = blogPosts.filter(p => !dbSlugs.has(p.slug.toLowerCase()));

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
  };

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    const cleanSlug = slug.toLowerCase().trim();
    console.log(`[useBlogPost] Fetching post for slug: "${cleanSlug}" (original: "${slug}")`);
    setIsLoading(true);
    setError(null);

    try {
      // 1. Try case-insensitive slug match in Supabase
      console.log(`[useBlogPost] Step 1: Trying Supabase slug match...`);
      const { data: slugData, error: slugError } = await supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", cleanSlug)
        .eq("status", "published")
        .maybeSingle();

      if (slugData) {
        console.log(`[useBlogPost] Match found in Supabase: ${slugData.title}`);
        setPost(slugData);
        setIsLoading(false);
        return;
      }

      if (slugError) {
        console.error(`[useBlogPost] Supabase fetch error:`, slugError);
      }

      // 2. Forced Fallback to static data
      console.log(`[useBlogPost] Step 2: Falling back to static blogPosts array...`);
      const staticPost = blogPosts.find(
        (p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug
      );

      if (staticPost) {
        console.log(`[useBlogPost] Match found in static data: ${staticPost.title}`);
        setPost(staticPost as unknown as BlogPost);
      } else {
        console.warn(`[useBlogPost] No match found for "${cleanSlug}" in any source.`);
        setPost(null);
      }
    } catch (err) {
      console.error(`[useBlogPost] Unexpected error:`, err);
      // Even on error, try static fallback
      const staticPost = blogPosts.find(
        (p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug
      );
      if (staticPost) {
        setPost(staticPost as unknown as BlogPost);
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
