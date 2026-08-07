import { useParams, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Share2, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { useAutoLinking } from "@/hooks/useAutoLinking";
import { usePageTracking, useLinkTracking } from "@/hooks/usePageTracking";
import { InternalLinkBridge } from "@/components/blog/InternalLinkBridge";
import { calculateQualityScore } from "@/lib/seoAudit";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

const ArticleSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <Skeleton className="h-6 w-24 rounded-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-3/4" />
    <div className="flex gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  </div>
);

const BlogPost = () => {
  const { id } = useParams();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const { post, isLoading, error } = useBlogPost(id || "");
  const { applyAutoLinks, isLoading: autoLinksLoading } = useAutoLinking();
  const { trackLinkClick } = useLinkTracking();
  const { language, t } = useLanguage();

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };
  
  usePageTracking(post?.id);

  // The static prerendered HTML for this route may already contain an
  // Article JSON-LD <script id="prerendered-article-ld"> (see
  // scripts/inject-meta-tags.mjs), baked in for crawlers that read the raw
  // HTML without executing JS. Once React mounts, react-helmet-async renders
  // its own JSON-LD below from live data, so we remove the static one to
  // avoid two Article JSON-LD blocks coexisting on the same page.
  useEffect(() => {
    document.getElementById("prerendered-article-ld")?.remove();
  }, []);

  const linkedContent = useMemo(() => {
    if (!post?.content || autoLinksLoading) return post?.content || "";
    return applyAutoLinks(post.content, post.id);
  }, [post?.content, post?.id, applyAutoLinks, autoLinksLoading]);

  const isLowQuality = useMemo(() => {
    if (!post) return false;
    const score = calculateQualityScore(post, "blog");
    return score < 60;
  }, [post]);

  useEffect(() => {
    if (!post || !contentRef.current) return;

    if (location.hash) {
      const targetId = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor) {
        const href = anchor.getAttribute("href");
        const linkText = anchor.textContent || "";
        
        if (href?.startsWith("#")) {
          e.preventDefault();
          const targetId = href.substring(1);
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.pushState({}, "", href);
          }
        } else if (href) {
          trackLinkClick(href, linkText, post.id);
        }
      }
    };

    contentRef.current.addEventListener("click", handleLinkClick);
    
    return () => {
      contentRef.current?.removeEventListener("click", handleLinkClick);
    };
  }, [post, location.hash, trackLinkClick]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title || "",
        text: post?.excerpt || "",
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("blog.copied"));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <article className="py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-6">
            <ArticleSkeleton />
          </div>
        </article>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <Helmet>
          <title>{t("blog.notFound")} | AIPrintVerse</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("blog.notFound")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("blog.notFoundDesc")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={langPrefix("/blog")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("blog.backToBlog")}
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.featured_image || undefined,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at,
    "author": { "@type": "Person", "name": post.author_name },
    "publisher": {
      "@type": "Organization",
      "name": "AIPrintVerse",
      "url": "https://aiprintverse.com"
    },
    "description": post.meta_description || post.excerpt || "",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://aiprintverse.com/blog/${post.slug}`
    }
  };

  return (
    <Layout>
      {/* SEO */}
      <Helmet>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt || ""} />
        {isLowQuality && <meta name="robots" content="noindex, nofollow" />}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://aiprintverse.com/blog/${post.slug}`} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <link rel="canonical" href={`https://aiprintverse.com/blog/${post.slug}`} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Preload featured image */}
        {post.featured_image && (
          <link rel="preload" as="image" href={post.featured_image} />
        )}
      </Helmet>
      
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Link
              to={langPrefix("/blog")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("blog.backToBlog")}
            </Link>
          </motion.div>

          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {post.category}
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {post.published_at 
                    ? format(new Date(post.published_at), "MMMM d, yyyy")
                    : post.created_at
                      ? format(new Date(post.created_at), "MMMM d, yyyy")
                      : "Recently"}
                </span>
                {post.read_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.read_time}
                  </span>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Share2 className="h-4 w-4" />
                  {t("blog.share")}
                </button>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.header>

            {/* Featured Image */}
            {post.featured_image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-8 overflow-hidden rounded-2xl"
              >
                <img
                  src={post.featured_image}
                  alt={post.title}
                  loading="eager"
                  width={1200}
                  height={630}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}

            {/* Content */}
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg mt-10 max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-primary article-content"
              dangerouslySetInnerHTML={{ __html: linkedContent }}
            />

            {!post.content && post.excerpt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-10"
              >
                <p className="text-lg text-muted-foreground">{post.excerpt}</p>
              </motion.div>
            )}

            <InternalLinkBridge
              currentPostId={post.id}
              currentCategory={post.category}
              currentTags={post.tags || []}
              variant="end"
              maxSuggestions={3}
            />
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
