import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, CalendarDays } from "lucide-react";
import { useSmartLinking } from "@/hooks/useSmartLinking";
import { cn } from "@/lib/utils";

interface InternalLinkBridgeProps {
  currentPostId: string;
  currentCategory: string;
  currentTags: string[];
  variant?: "end" | "inline" | "sidebar";
  maxSuggestions?: number;
  className?: string;
}

export function InternalLinkBridge({
  currentPostId,
  currentCategory,
  currentTags,
  variant = "end",
  maxSuggestions = 3,
  className,
}: InternalLinkBridgeProps) {
  const { getSuggestions, isCurrentPageIndexed, isLoading } = useSmartLinking(currentPostId);

  const suggestions = useMemo(() => {
    const isIndexed = isCurrentPageIndexed(currentPostId);

    return getSuggestions(
      { category: currentCategory, tags: currentTags },
      {
        limit: maxSuggestions,
        prioritizePending: isIndexed, // Prioritize pending if current page is indexed
        excludeIds: [currentPostId]
      }
    );
  }, [currentPostId, currentCategory, currentTags, maxSuggestions, getSuggestions, isCurrentPageIndexed]);

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  // Get topic label from category or most common tag
  const topicLabel = currentCategory !== "General"
    ? currentCategory
    : (currentTags[0] || "Design");

  const containerStyles = {
    end: "mt-14 pt-10 border-t border-border/70",
    inline: "my-8 mx-auto max-w-2xl",
    sidebar: "sticky top-24",
  };

  const cardStyles = {
    end: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    inline: "flex flex-col gap-3",
    sidebar: "flex flex-col gap-3",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(containerStyles[variant], className)}
      aria-labelledby="related-reads-heading"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Recommended Reads
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-primary/40 via-border to-transparent" aria-hidden="true" />
        </div>
        <h3
          id="related-reads-heading"
          className="mt-4 font-display text-2xl font-bold text-foreground md:text-[1.75rem] md:leading-snug"
        >
          Explore More <span className="text-primary">{topicLabel}</span> Guides
        </h3>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Continue your journey with our latest expert insights
        </p>
      </div>

      {/* Suggestions Grid/List */}
      <div className={cardStyles[variant]}>
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={suggestion.post.id}
            suggestion={suggestion}
            variant={variant}
            index={index}
          />
        ))}
      </div>

      {/* View All CTA */}
      <div className="mt-8 text-center">
        <Link
          to={`/blog?category=${encodeURIComponent(currentCategory)}`}
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md"
        >
          <span>View all {topicLabel} articles</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.section>
  );
}

interface SuggestionPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt?: string | null;
  featured_image?: string | null;
  indexing_status: "indexed" | "pending";
  published_at?: string | null;
  content?: string | null;
}

interface SuggestionCardProps {
  suggestion: {
    post: SuggestionPost;
    matchReason: string[];
  };
  variant: "end" | "inline" | "sidebar";
  index: number;
}

function estimateReadTime(content?: string | null): number {
  if (!content) return 4;
  const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function SuggestionCard({ suggestion, variant, index }: SuggestionCardProps) {
  const { post } = suggestion;
  const isPending = post.indexing_status === "pending";
  const readTime = estimateReadTime(post.content);
  const dateLabel = formatDate(post.published_at);

  if (variant === "inline" || variant === "sidebar") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Link
          to={`/blog/${post.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          {post.featured_image && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={post.featured_image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              {post.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {post.category}
                </span>
              )}
              {isPending && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  New
                </span>
              )}
            </div>
            <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {post.title}
            </h4>
          </div>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </motion.div>
    );
  }

  // End variant - larger cards
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Link
        to={`/blog/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.35)]"
      >
        {/* Image */}
        {post.featured_image && (
          <div className="relative aspect-[120/63] overflow-hidden bg-muted">
            <img
              src={post.featured_image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/10"
              aria-hidden="true"
            />
            {post.category && (
              <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                {post.category}
              </span>
            )}
            {isPending && (
              <span className="absolute right-3 top-3 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-950 shadow-sm">
                New
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readTime} min read
            </span>
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {dateLabel}
              </span>
            )}
          </div>

          <h4 className="mt-2.5 line-clamp-2 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {post.title}
          </h4>

          {post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          {/* Read More */}
          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-sm font-semibold text-primary">
                Read the guide
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
