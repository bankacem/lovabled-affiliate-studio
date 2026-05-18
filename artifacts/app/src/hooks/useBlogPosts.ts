import { useListBlogPosts, useGetBlogPostBySlug, useListBlogCategories } from "@workspace/api-client-react";

export type { BlogPost } from "@workspace/api-client-react";

export function useBlogPosts(page: number = 1, pageSize: number = 12, category?: string) {
  const result = useListBlogPosts({ page, pageSize, category: category !== "All" ? category : undefined });
  return {
    posts: result.data?.posts ?? [],
    totalCount: result.data?.total ?? 0,
    totalPages: result.data?.totalPages ?? 0,
    isLoading: result.isLoading,
    error: result.error?.message ?? null,
  };
}

export function useBlogPost(slug: string) {
  const result = useGetBlogPostBySlug(slug, { query: { enabled: !!slug } });
  return {
    post: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error?.message ?? null,
  };
}

export function useBlogCategories() {
  const result = useListBlogCategories();
  const categories = result.data ? ["All", ...result.data.map(c => c.name)] : ["All"];
  return {
    categories,
    isLoading: result.isLoading,
  };
}
