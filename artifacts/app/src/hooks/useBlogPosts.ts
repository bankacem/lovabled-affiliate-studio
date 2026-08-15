import { useQuery } from "@tanstack/react-query";

// Blog content is served from static files generated at build time from the
// GitHub-committed markdown in /content/blog. No database is involved, so the
// blog can never go down because of a backend outage.

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content?: string | null;
  excerpt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  author_name: string;
  category: string;
  tags: string[];
  read_time?: string | null;
  status: string;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BlogIndex {
  generated_at: string;
  total: number;
  categories: string[];
  posts: BlogPost[];
}

const EMPTY_INDEX: BlogIndex = { generated_at: "", total: 0, categories: [], posts: [] };

async function fetchIndex(): Promise<BlogIndex> {
  const res = await fetch("/blog-index.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load articles (${res.status})`);
  return (await res.json()) as BlogIndex;
}

export function useBlogIndex() {
  return useQuery({
    queryKey: ["blog-index"],
    queryFn: fetchIndex,
    staleTime: 5 * 60 * 1000,
  });
}

function sanitizePage(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export function useBlogPosts(page: number = 1, pageSize: number = 12, category?: string) {
  const safePage = sanitizePage(page);
  const safePageSize = Math.max(1, Math.min(Math.floor(pageSize || 12), 100));
  const selectedCategory = category && category !== "All" ? category : undefined;

  const result = useBlogIndex();
  const index = result.data ?? EMPTY_INDEX;

  const all = selectedCategory
    ? index.posts.filter((p) => p.category === selectedCategory)
    : index.posts;

  const from = (safePage - 1) * safePageSize;

  return {
    posts: all.slice(from, from + safePageSize),
    totalCount: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / safePageSize)),
    isLoading: result.isLoading,
    error: result.error ? (result.error as Error).message : null,
  };
}

export function useBlogPost(slug: string) {
  const result = useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(`/blog/${encodeURIComponent(slug)}.json`, { cache: "no-cache" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to load article (${res.status})`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) return null; // SPA fallback HTML
      return (await res.json()) as BlogPost;
    },
  });

  return {
    post: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error ? (result.error as Error).message : null,
  };
}

export function useBlogCategories() {
  const result = useBlogIndex();
  return {
    categories: ["All", ...(result.data?.categories ?? [])],
    isLoading: result.isLoading,
  };
}
