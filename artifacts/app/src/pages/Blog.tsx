import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { BlogCard } from "@/components/blog/BlogCard";
import { useBlogPosts, useBlogCategories } from "@/hooks/useBlogPosts";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const BlogSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden bg-card shadow-card">
        <Skeleton className="aspect-[2/1] w-full" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    ))}
  </div>
);

const Blog = () => {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("page")) || 1;
  });
  const { posts, totalPages, totalCount, isLoading } = useBlogPosts(page, PAGE_SIZE);
  const { categories } = useBlogCategories();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    window.history.pushState({}, "", `/blog?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = Math.max(1, end - 4); i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <Layout>
      {/* SEO */}
      {page > 1 && (
        <link rel="prev" href={`https://aiprintverse.com/blog?page=${page - 1}`} />
      )}
      {page < totalPages && (
        <link rel="next" href={`https://aiprintverse.com/blog?page=${page + 1}`} />
      )}
      <link rel="canonical" href={`https://aiprintverse.com/blog${page > 1 ? `?page=${page}` : ""}`} />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Blog
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Design tips, trends, and inspiration for your style
            </p>
            {totalCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {totalCount} articles
              </p>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results */}
          <div className="mt-10">
            {isLoading ? (
              <BlogSkeleton />
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchQuery || selectedCategory !== "All"
                    ? "No articles found. Try adjusting your search."
                    : "No articles published yet. Check back soon!"}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-12 flex flex-col items-center gap-4" aria-label="Blog pagination">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    page <= 1
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {paginationPages[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      1
                    </button>
                    {paginationPages[0] > 2 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                  </>
                )}

                {paginationPages.map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      p === page
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    {p}
                  </button>
                ))}

                {paginationPages[paginationPages.length - 1] < totalPages && (
                  <>
                    {paginationPages[paginationPages.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    page >= totalPages
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            </nav>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
