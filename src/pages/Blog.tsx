import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FileText } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/layout/SEO";
import { BlogCard } from "@/components/blog/BlogCard";
import { useBlogPosts, useBlogCategories } from "@/hooks/useBlogPosts";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POSTS_PER_PAGE = 24;

const Blog = () => {
  const { posts, isLoading } = useBlogPosts();
  const { categories } = useBlogCategories();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesCategory && matchesSearch;
    });
    return filtered;
  }, [posts, selectedCategory, searchQuery]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [selectedCategory, searchQuery]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  return (
    <Layout>
      <SEO
        title={selectedCategory === "All" ? "Blog" : `${selectedCategory} Blog`}
        description="Design tips, trends, and inspiration for your style. Read our latest articles about AI-powered print-on-demand designs."
        canonical={selectedCategory === "All" ? "/blog" : `/blog?category=${selectedCategory}`}
      />
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
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            {/* Search */}
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

            {/* Categories */}
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

          {/* Results count */}
          {!isLoading && filteredPosts.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Showing {Math.min(visibleCount, filteredPosts.length)} of {filteredPosts.length} articles
            </p>
          )}

          {/* Results */}
          <div className="mt-10">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visiblePosts.map((post, index) => (
                    <BlogCard key={post.id} post={post} index={Math.min(index, 5)} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                      className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
                    >
                      Load More ({filteredPosts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
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
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
