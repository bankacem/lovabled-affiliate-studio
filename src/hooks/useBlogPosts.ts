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
    const fuzzySlug = cleanSlug.includes("-")
      ? cleanSlug.replace(/-/g, "_")
      : cleanSlug.replace(/_/g, "-");

    console.log(`[useBlogPost] DIAGNOSTIC: Starting fetch for cleanSlug: "${cleanSlug}"`);
    setIsLoading(true);
    setError(null);

    // Stage 0: Instant Static Fallback
    // We check this first to ensure immediate UI response
    const staticMatch = blogPosts.find(p =>
      p.slug.toLowerCase() === cleanSlug ||
      p.id === cleanSlug ||
      p.slug.toLowerCase() === fuzzySlug
    );

    if (staticMatch) {
      console.log(`[useBlogPost] Stage 0 (Static): Instant match found for ${cleanSlug}`);
      const post = staticMatch as BlogPost;
      setPost({
        ...post,
        meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
        meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
        canonical_url: post.canonical_url || `/blog/${post.slug}`
      });
      setIsLoading(false);
      // We continue to fetch from DB to get the most up-to-date content if it exists
    }

    try {
      // Stage 1: Exact slug match
      console.log(`[useBlogPost] Attempting exact slug match for: ${cleanSlug}`);
      const { data: exactMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      console.log(`[useBlogPost] Stage 1 (Exact): ${exactMatch ? "MATCH FOUND" : "No match"}`);

      if (exactMatch) {
        const post = exactMatch as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: post.canonical_url || `/blog/${post.slug}`
        });
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

        console.log(`[useBlogPost] Stage 2 (ID/UUID): ${idMatch ? "MATCH FOUND" : "No match"}`);

        if (idMatch) {
          const post = idMatch as BlogPost;
          setPost({
            ...post,
            meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
            meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
            canonical_url: post.canonical_url || `/blog/${post.slug}`
          });
          setIsLoading(false);
          return;
        }
      }

      // Stage 3: Fuzzy slug match (hyphens vs underscores)
      // This handles legacy data where slugs might have used underscores instead of hyphens
      if (fuzzySlug !== cleanSlug) {
        console.log(`[useBlogPost] Attempting fuzzy slug match: ${fuzzySlug}`);
        const { data: fuzzyMatch } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", fuzzySlug)
          .maybeSingle();

        console.log(`[useBlogPost] Stage 3 (Fuzzy): ${fuzzyMatch ? "MATCH FOUND" : "No match"}`);

        if (fuzzyMatch) {
          const post = fuzzyMatch as BlogPost;
          setPost({
            ...post,
            meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
            meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
            canonical_url: post.canonical_url || `/blog/${post.slug}`
          });
          setIsLoading(false);
          return;
        }
      }

      // Stage 4: Case-insensitive & Partial match (using ilike with wildcards)
      // This helps find slugs that have extra SEO suffixes in the DB
      console.log(`[useBlogPost] Attempting partial match for: %${cleanSlug}%`);
      const { data: partialMatch } = await supabase
        .from("blog_posts")
        .select("*")
        .ilike("slug", `%${cleanSlug}%`)
        .limit(1);

      const foundPartialMatch = partialMatch && partialMatch.length > 0 ? partialMatch[0] : null;
      console.log(`[useBlogPost] Stage 4 (Partial/ilike): ${foundPartialMatch ? "MATCH FOUND" : "No match"}`);

      if (foundPartialMatch) {
        const post = foundPartialMatch as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: post.canonical_url || `/blog/${post.slug}`
        });
        setIsLoading(false);
        return;
      }

      // Stage 5: Suffix-agnostic comparison
      console.log(`[useBlogPost] Attempting suffix-agnostic comparison for: ${cleanSlug}`);
      const { data: slugList } = await supabase
        .from("blog_posts")
        .select("id, slug")
        .eq("status", "published");

      if (slugList) {
        const normalize = (s: string) => s.toLowerCase()
          .replace(/_/g, '-')
          .split('-2026-')[0] // Handle cases like beagle-shirts-2026-...
          .replace(/-design-protection-and-style$/, '')
          .replace(/-everything-you-need-to-know$/, '')
          .replace(/-a-complete-guide$/, '')
          .replace(/-the-ultimate-guide$/, '');

        const target = normalize(cleanSlug);
        const match = slugList.find(item => normalize(item.slug) === target);

        if (match) {
          console.log(`[useBlogPost] Stage 5 (Normalization): MATCH FOUND: ${match.slug}`);
          const { data: fullPost } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("id", match.id)
            .maybeSingle();

          if (fullPost) {
            const post = fullPost as BlogPost;
            setPost({
              ...post,
              meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
              meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
              canonical_url: post.canonical_url || `/blog/${post.slug}`
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // Stage 6: Static Fallback
      console.log(`[useBlogPost] No DB match found. Checking static fallback for: ${cleanSlug}`);

      // If we found a static match in Stage 0, we already set the post.
      // We check again here in case we missed it or need a final confirmation.
      const fallbackMatch = staticMatch || blogPosts.find(p =>
        p.slug.toLowerCase() === cleanSlug ||
        p.id === cleanSlug ||
        p.slug.toLowerCase() === fuzzySlug
      );

      console.log(`[useBlogPost] Stage 6 (Static): ${fallbackMatch ? "MATCH FOUND" : "No match"}`);

      if (fallbackMatch) {
        const post = fallbackMatch as BlogPost;
        setPost({
          ...post,
          meta_title: post.meta_title || `${post.title} | AIPrintVerse`,
          meta_description: post.meta_description || post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : ""),
          canonical_url: post.canonical_url || `/blog/${post.slug}`
        });
        setIsLoading(false);
        return;
      }

      console.log(`[useBlogPost] No DB match found. Fetching sample slugs for diagnostic comparison...`);
      const { data: sampleSlugs } = await supabase
        .from("blog_posts")
        .select("slug")
        .limit(5);
      console.log(`[useBlogPost] DIAGNOSTIC - Sample DB Slugs:`, sampleSlugs?.map(p => p.slug));

      setPost(null);
    } catch (err) {
      console.error("[useBlogPost] Unexpected error fetching post:", err);
      const errorMessage = err instanceof Error ? err.message : "Post not found";
      // Final desperation fallback to static data
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
