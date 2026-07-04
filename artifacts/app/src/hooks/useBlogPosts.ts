import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

function sanitizePage(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function useBlogPosts(page: number = 1, pageSize: number = 12, category?: string) {
  const safePage = sanitizePage(page);
  const safePageSize = Math.max(1, Math.min(Math.floor(pageSize || 12), 100));
  const selectedCategory = category && category !== "All" ? category : undefined;

  const result = useQuery({
    queryKey: ["blog-posts", safePage, safePageSize, selectedCategory],
    queryFn: async () => {
      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .not("slug", "is", null)
        .neq("slug", "")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const total = count ?? 0;
      return {
        posts: data ?? [],
        total,
        totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      };
    },
  });

  return {
    posts: result.data?.posts ?? [],
    totalCount: result.data?.total ?? 0,
    totalPages: result.data?.totalPages ?? 0,
    isLoading: result.isLoading,
    error: result.error?.message ?? null,
  };
}

export function useBlogPost(slug: string) {
  const result = useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return {
    post: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error?.message ?? null,
  };
}

export function useBlogCategories() {
  const result = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = result.data ? ["All", ...result.data.map((c) => c.name)] : ["All"];
  return {
    categories,
    isLoading: result.isLoading,
  };
}
