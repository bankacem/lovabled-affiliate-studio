import { useState, useEffect, useCallback } from "react";
import { blogPosts, blogCategories } from "@/data/blogPosts";
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
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const applySEOFallbacks = (post: any): BlogPost => {
  const meta_title = post.meta_title || `${post.title} | AIPrintVerse`;
  const meta_description = post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : "");
  const canonical_url = post.canonical_url || `/blog/${post.slug}`;

  return {
    ...post,
    meta_title,
    meta_description,
    canonical_url
  };
};

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Filter for published posts and apply SEO fallbacks
      const allPosts = blogPosts
        .filter(post => post.status === "published")
        .map(applySEOFallbacks)
        .sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at).getTime();
          const dateB = new Date(b.published_at || b.created_at).getTime();
          return dateB - dateA; // Newest first
        });

      setPosts(allPosts as BlogPost[]);
    } catch (err) {
      console.error("[useBlogPosts] Error processing posts:", err);
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
    if (!rawSlug) return;

    const cleanSlug = rawSlug.toLowerCase().trim();
    setIsLoading(true);
    setError(null);

    try {
      // Search in local data with case-insensitive match
      const matchedPost = blogPosts.find(p =>
        p.slug.toLowerCase() === cleanSlug ||
        p.id === cleanSlug
      );

      if (matchedPost) {
        setPost(applySEOFallbacks(matchedPost));
      } else {
        setPost(null);
        setError("Post not found");
      }
    } catch (err) {
      console.error("[useBlogPost] Error fetching post:", err);
      setError(err instanceof Error ? err.message : "Post not found");
    } finally {
      setIsLoading(false);
    }
  }, [rawSlug]);

  useEffect(() => {
    fetchPost();
  }, [rawSlug, fetchPost]);

  return { post, isLoading, error };
}

export function useBlogCategories() {
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCategories(blogCategories);
    setIsLoading(false);
  }, []);

  return { categories, isLoading };
}
