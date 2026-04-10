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

// ═══════════════════════════════════════════════════════════════
// دالة تنسيق الـ Slug
// ═══════════════════════════════════════════════════════════════
function normalizeSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[_\s]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ═══════════════════════════════════════════════════════════════
// دالة إغناء المقالات بالبيانات الناقصة
// ═══════════════════════════════════════════════════════════════
function enrichPost(post: any): BlogPost {
  const safeTitle = post?.title || "Untitled Post";
  const safeSlug = post?.slug || "no-slug";

  return {
    ...post,
    title: safeTitle,
    slug: safeSlug,
    meta_title: post?.meta_title || `${safeTitle} | AIPrintVerse`,
    meta_description:
      post?.meta_description ||
      post?.excerpt ||
      (post?.content ? post.content.replace(/<[^>]*>/g, "").slice(0, 160) : "No description available"),
    canonical_url: post?.canonical_url || `/blog/${safeSlug}`,
    tags: Array.isArray(post?.tags) ? post.tags : [],
    status: post?.status || "draft",
    published_at: post?.published_at || post?.created_at || new Date().toISOString(),
  } as BlogPost;
}

// ═══════════════════════════════════════════════════════════════
// تخزين مؤقت للمقالات المحلية (للبحث السريع)
// ═══════════════════════════════════════════════════════════════
const normalizedStaticPosts = new Map(
  blogPosts.map(p => [normalizeSlug(p.slug), p])
);

const BLOG_POST_LIST_COLUMNS = [
  "id",
  "title",
  "slug",
  "excerpt",
  "featured_image",
  "author_name",
  "category",
  "tags",
  "status",
  "read_time",
  "meta_title",
  "meta_description",
  "published_at",
  "created_at",
  "updated_at",
].join(", ");

const BLOG_POST_FULL_COLUMNS = `${BLOG_POST_LIST_COLUMNS}, content`;

interface UseBlogPostsOptions {
  includeContent?: boolean;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
// الحصول على جميع المقالات
// ═══════════════════════════════════════════════════════════════
export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { includeContent = false, limit } = options;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase || typeof supabase.from !== 'function') {
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from("blog_posts")
        .select(includeContent ? BLOG_POST_FULL_COLUMNS : BLOG_POST_LIST_COLUMNS)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (typeof limit === "number") {
        query = query.limit(limit);
      }

      const { data: dbPosts, error: dbError } = await query;

      if (dbError) {
        console.error("Supabase error fetching posts:", dbError);
        setError(dbError.message);
      }

      const dbPostsList = dbPosts || [];

      const allPosts = dbPostsList
        .map((post) => enrichPost(post as any))
        .sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at).getTime();
          const dateB = new Date(b.published_at || b.created_at).getTime();
          return dateB - dateA;
        });

      if (dbPostsList.length === 0) {
        console.warn("No posts found (DB or static). Falling back to all static data.");
        setPosts(blogPosts.map((p) => enrichPost(p as any)));
      } else {
        setPosts(allPosts);
      }
    } catch (err) {
      console.error("Major error in fetchPosts:", err);
      setPosts(blogPosts.map((p) => enrichPost(p as any)));
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [includeContent, limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
}

// ═══════════════════════════════════════════════════════════════
// الحصول على مقال واحد بالـ Slug
// ═══════════════════════════════════════════════════════════════
export function useBlogPost(rawSlug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!rawSlug) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    // تنسيق الـ Slug
    const cleanSlug = normalizeSlug(rawSlug);

    // ═══════════════════════════════════════════════════════════
    // المرحلة 1: البحث في المقالات المحلية أولاً (الأسرع)
    // ═══════════════════════════════════════════════════════════
    const staticMatch = normalizedStaticPosts.get(cleanSlug);
    if (staticMatch) {
      setPost(enrichPost(staticMatch as any));
      setIsLoading(false);
      return;
    }

    // البحث الجزئي في المقالات المحلية
    for (const [, staticPost] of normalizedStaticPosts) {
      const normalizedStaticSlug = normalizeSlug(staticPost.slug);
      if (
        normalizedStaticSlug === cleanSlug ||
        normalizedStaticSlug.includes(cleanSlug) ||
        cleanSlug.includes(normalizedStaticSlug)
      ) {
        setPost(enrichPost(staticPost as any));
        setIsLoading(false);
        return;
      }
    }

    try {
      if (!supabase || typeof supabase.from !== 'function') {
        setPost(null);
        setIsLoading(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════
      // المرحلة 2: البحث في قاعدة البيانات بالـ Slug المنظم
      // ═══════════════════════════════════════════════════════════
      const { data: exactMatch, error: exactError } = await supabase
        .from("blog_posts")
        .select(BLOG_POST_FULL_COLUMNS)
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (exactError) console.error("Error fetching exact match:", exactError);

      if (exactMatch) {
        setPost(enrichPost(exactMatch as any));
        setIsLoading(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════
      // المرحلة 3: البحث بالـ Slug الأصلي
      // ═══════════════════════════════════════════════════════════
      const { data: originalMatch } = await supabase
        .from("blog_posts")
        .select(BLOG_POST_FULL_COLUMNS)
        .eq("slug", rawSlug)
        .maybeSingle();

      if (originalMatch) {
        setPost(enrichPost(originalMatch as any));
        setIsLoading(false);
        return;
      }

      // ═══════════════════════════════════════════════════════════
      // المرحلة 4: البحث بالمعرف القديم (UUID)
      // ═══════════════════════════════════════════════════════════
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
      if (isUUID) {
        const { data: idMatch } = await supabase
          .from("blog_posts")
          .select(BLOG_POST_FULL_COLUMNS)
          .eq("id", cleanSlug)
          .maybeSingle();
        if (idMatch) {
          setPost(enrichPost(idMatch as any));
          setIsLoading(false);
          return;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // المرحلة 5: البحث التقريبي
      // ═══════════════════════════════════════════════════════════
      const { data: similarMatches } = await supabase
        .from("blog_posts")
        .select(BLOG_POST_FULL_COLUMNS)
        .ilike("slug", `%${cleanSlug}%`)
        .limit(1);

      if (similarMatches?.[0]) {
        setPost(enrichPost(similarMatches[0] as any));
        setIsLoading(false);
        return;
      }

      // المقالة غير موجودة
      setPost(null);
      setError("المقال غير موجود");
    } catch (err) {
      console.error("Error fetching post:", err);
      setError(err instanceof Error ? err.message : "Post not found");
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, [rawSlug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, isLoading, error };
}

// ═══════════════════════════════════════════════════════════════
// الحصول على الفئات
// ═══════════════════════════════════════════════════════════════
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
