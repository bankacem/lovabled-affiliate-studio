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
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
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
    console.log(`[useBlogPost] Fetching post for slug/id: "${slug}"`);
    setIsLoading(true);
    setError(null);

    try {
      // 1. Try case-insensitive slug match
      console.log(`[useBlogPost] Step 1: Trying case-insensitive slug match via ilike...`);
      const { data: slugData, error: slugError } = await supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (slugData) {
        console.log(`[useBlogPost] Match found in Supabase by slug: ${slugData.title}`);
        setPost(slugData);
        setIsLoading(false);
        return;
      }

      if (slugError) {
        console.error(`[useBlogPost] Supabase slug fetch error:`, slugError);
      }

      // 2. Try UUID match if slug looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(slug)) {
        console.log(`[useBlogPost] Step 2: Input looks like a UUID, trying ID match...`);
        const { data: idData, error: idError } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", slug)
          .eq("status", "published")
          .maybeSingle();

        if (idData) {
          console.log(`[useBlogPost] Match found in Supabase by ID: ${idData.title}`);
          setPost(idData);
          setIsLoading(false);
          return;
        }

        if (idError) {
          console.error(`[useBlogPost] Supabase ID fetch error:`, idError);
        }
      }

      // 3. Fallback to static data (case-insensitive)
      console.log(`[useBlogPost] Step 3: No Supabase match, checking static blogPosts array...`);
      const staticPost = blogPosts.find(
        (p) => p.slug.toLowerCase() === slug.toLowerCase() || p.id === slug
      );

      if (staticPost) {
        console.log(`[useBlogPost] Match found in static data: ${staticPost.title}`);
        setPost(staticPost as unknown as BlogPost);
      } else {
        console.warn(`[useBlogPost] No match found for "${slug}" in any source.`);
        setPost(null);
      }
    } catch (err) {
      console.error(`[useBlogPost] Unexpected error:`, err);
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
