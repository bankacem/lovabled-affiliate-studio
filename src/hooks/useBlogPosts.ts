import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { blogPosts as staticBlogPosts } from "@/data/blogPosts";

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
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching from Supabase:", error);
        // Fallback to static posts if Supabase fails
        setPosts(staticBlogPosts as BlogPost[]);
      } else {
        // Merge Supabase posts with static posts, avoiding duplicates by slug
        const supabasePosts = data || [];
        const supabaseSlugs = new Set(supabasePosts.map(p => p.slug.toLowerCase()));

        const uniqueStaticPosts = staticBlogPosts.filter(
          p => !supabaseSlugs.has(p.slug.toLowerCase())
        );

        setPosts([...supabasePosts, ...uniqueStaticPosts] as BlogPost[]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchPosts:", err);
      setPosts(staticBlogPosts as BlogPost[]);
    } finally {
      setIsLoading(false);
    }
  };

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function useBlogPost(identifier: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (identifier) {
      fetchPost();
    }
  }, [identifier]);

  const fetchPost = async () => {
    setIsLoading(true);
    const lowerIdentifier = identifier.toLowerCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    console.log(`[useBlogPost] Fetching post for identifier: "${identifier}" (isUUID: ${isUUID})`);

    try {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published");

      if (isUUID) {
        query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
      } else {
        // Try case-insensitive slug match
        query = query.ilike("slug", lowerIdentifier);
      }

      const { data, error: supabaseError } = await query.maybeSingle();

      if (supabaseError) {
        console.warn(`[useBlogPost] Supabase warning: ${supabaseError.message}`);
        // Continue to static fallback
      }

      if (data) {
        console.log(`[useBlogPost] Found post in Supabase: "${data.title}"`);
        setPost(data as BlogPost);
      } else {
        console.log(`[useBlogPost] Not found in Supabase, checking static data...`);
        const staticPost = staticBlogPosts.find(
          (p) => p.slug.toLowerCase() === lowerIdentifier || p.id === identifier
        );

        if (staticPost) {
          console.log(`[useBlogPost] Found post in static data: "${staticPost.title}"`);
          setPost(staticPost as BlogPost);
        } else {
          console.log(`[useBlogPost] Post not found in any source.`);
          setPost(null);
        }
      }
    } catch (err) {
      console.error("[useBlogPost] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
