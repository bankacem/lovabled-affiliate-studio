import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Share2, Tag, Home } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import { useAutoLinking } from "@/hooks/useAutoLinking";
import { usePageTracking, useLinkTracking } from "@/hooks/usePageTracking";
import { InternalLinkBridge } from "@/components/blog/InternalLinkBridge";
import { ProductShowcase } from "@/components/blog/ProductShowcase";
import { CTAButton } from "@/components/blog/CTAButton";
import { stripMicrodata } from "@/lib/seoUtils";
import { toast } from "sonner";
import { format } from "date-fns";
import allSlugsData from "../../all_slugs.json";

const BlogPost = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { post, isLoading, error } = useBlogPost(slug || "");
  const { posts: allPostsList } = useBlogPosts({ limit: 250 });

  // Related Articles — deterministic sort using post.id as seed
  const relatedArticles = useMemo(() => {
    if (!post || !allPostsList.length) return [];

    const candidates = allPostsList.filter((p) => {
      if (p.id === post.id || p.slug === post.slug) return false;
      const inSlugPool = allSlugsData.some((s: { slug: string }) => s.slug === p.slug);
      if (!inSlugPool) return false;
      return p.category === post.category || p.tags.some((tag) => post.tags.includes(tag));
    });

    // FIXED: Deterministic sort using post.id as seed — no more random reorders
    const seed = post.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return [...candidates]
      .sort((a, b) => ((a.id.charCodeAt(0) + seed) % 100) - ((b.id.charCodeAt(0) + seed) % 100))
      .slice(0, 3);
  }, [post, allPostsList]);

  // FIXED: Removed RCA console.log statements (leaked private data to DevTools)

  const { applyAutoLinks, isLoading: autoLinksLoading } = useAutoLinking();
  const { trackLinkClick } = useLinkTracking();

  // Track page view
  usePageTracking(post?.id);

  // Canonical Redirect logic
  useEffect(() => {
    if (post && post.slug && slug && post.slug !== slug) {
      navigate(`/blog/${post.slug}`, { replace: true });
    }
  }, [post, slug, navigate]);

  // Extract FAQ data for schema
  const extractFAQSchema = (content: string) => {
    if (!content) return null;

    // Look for FAQ section - specifically a heading
    const faqSectionMatch = content.match(/<h2[^>]*>.*?Frequently Asked Questions.*?<\/h2>([\s\S]*)/i);
    if (!faqSectionMatch) return null;

    // Only look at content until the next h2 or end of string to avoid matching other sections
    const faqContent = faqSectionMatch[1].split(/<h2/i)[0];
    const questions: { question: string, answer: string }[] = [];

    // Regex to find <h3>Question</h3> followed by next element which is usually a <p>Answer</p>
    // This is a simplified parser for the common pattern in the blog posts
    const qRegex = /<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;
    let match;

    while ((match = qRegex.exec(faqContent)) !== null && questions.length < 10) {
      const question = match[1].replace(/<[^>]*>/g, '').trim();
      const answer = match[2].replace(/<[^>]*>/g, '').trim();

      if (question && answer) {
        questions.push({ question, answer });
      }
    }

    if (questions.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questions.map(q => ({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.answer
        }
      }))
    };
  };

  const faqSchema = useMemo(() => extractFAQSchema(post?.content || ""), [post?.content]);

  // Consolidate all schemas into a single array for the SEO component
  const jsonLd = useMemo(() => {
    if (!post) return [];

    const schemas: Record<string, unknown>[] = [
      {
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.featured_image ? [post.featured_image] : [],
        "datePublished": post.published_at || post.created_at,
        "dateModified": post.updated_at || post.published_at || post.created_at,
        "author": [{
            "@type": "Person",
            "name": post.author_name || "AIPrintVerse Team"
          }],
        "description": post.excerpt || post.meta_description || ""
      },
      {
        "@type": "Article",
        "headline": post.title,
        "image": post.featured_image ? [post.featured_image] : [],
        "datePublished": post.published_at || post.created_at,
        "dateModified": post.updated_at || post.published_at || post.created_at,
        "author": [{
            "@type": "Person",
            "name": post.author_name || "AIPrintVerse Team"
          }],
        "publisher": {
          "@type": "Organization",
          "name": "AIPrintVerse",
          "logo": {
            "@type": "ImageObject",
            "url": "https://aiprintverse.com/logo.png"
          }
        },
        "description": post.excerpt || post.meta_description || ""
      },
      {
        "@type": "Product",
        "name": post.title,
        "image": post.featured_image ? [post.featured_image] : [],
        "description": post.excerpt || post.meta_description || "",
        "brand": {
          "@type": "Brand",
          "name": "AIPrintVerse"
        },
        "offers": {
          "@type": "AggregateOffer",
          "offerCount": 1,
          "lowPrice": "15.95",
          "highPrice": "45.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }
    ];

    if (faqSchema) {
      schemas.push(faqSchema);
    }

    // Breadcrumb Schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://aiprintverse.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://aiprintverse.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": post.category,
          "item": `https://aiprintverse.com/blog?category=${encodeURIComponent(post.category)}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": post.title,
          "item": `https://aiprintverse.com/blog/${post.slug}`
        }
      ]
    });

    return schemas;
  }, [post, faqSchema]);

  // Apply auto-linking to content and strip Microdata to prevent duplication with JSON-LD
  const processedContent = useMemo(() => {
    if (!post?.content || autoLinksLoading) return post?.content || "";
    const linked = applyAutoLinks(post.content, post.id);
    return stripMicrodata(linked);
  }, [post?.content, post?.id, applyAutoLinks, autoLinksLoading]);

  // Handle anchor links and track clicks
  useEffect(() => {
    if (!post || !contentRef.current) return;

    // Handle initial hash on page load
    if (location.hash) {
      const targetId = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }

    // Add click handlers for links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor) {
        const href = anchor.getAttribute("href");
        const linkText = anchor.textContent || "";
        
        // Handle in-page anchor links (e.g., #section-id)
        if (href?.startsWith("#")) {
          e.preventDefault();
          const targetId = href.substring(1);
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.pushState({}, "", href);
          }
        } else if (href) {
          // Track link clicks (internal and external)
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
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
      </Layout>
    );
  }

  if (!isLoading && !post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <Button asChild className="mt-4">
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || ""}
        canonical={`/blog/${post.slug}`}
        ogImage={post.featured_image || ""}
        ogType="article"
        jsonLd={jsonLd}
      />
      
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      <span className="sr-only md:not-sr-only">Home</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/blog">Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/blog?category=${encodeURIComponent(post.category)}`}>
                      {post.category}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[200px] truncate md:max-w-none">
                    {post.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
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
                  {(() => {
                    const dateStr = post.published_at || post.created_at;
                    if (!dateStr) return "N/A";
                    try {
                      const date = new Date(dateStr);
                      if (isNaN(date.getTime())) return "Invalid Date";
                      return format(date, "MMMM d, yyyy");
                    } catch (e) {
                      console.error("Date formatting error:", e);
                      return "Invalid Date";
                    }
                  })()}
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
                  Share
                </button>
              </div>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
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
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}

            {/* Content with auto-linking and CRO component injection */}
            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              {/* Main YouTube Video */}
              {post.video_url && (() => {
                const vidMatch = post.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
                const vidId = vidMatch ? vidMatch[1] : null;
                return vidId ? (
                  <div className="aspect-video rounded-lg overflow-hidden mb-8">
                    <iframe
                      src={`https://www.youtube.com/embed/${vidId}`}
                      className="w-full h-full"
                      allowFullScreen
                      title="فيديو المقال"
                    />
                  </div>
                ) : null;
              })()}
              {(() => {
                // Split content by <h2> tags to inject components
                // We use a simple split/regex approach for injection
                const sections = processedContent.split(/(?=<h2)/gi);

                return sections.map((section, index) => (
                  <div key={index}>
                    <div
                      className="prose prose-lg max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-primary article-content"
                      dangerouslySetInnerHTML={{ __html: section }}
                    />

                    {/* Inject ProductShowcase after the first <h2> section */}
                    {index === 0 && sections.length > 1 && <ProductShowcase />}

                    {/* Inject CTAButton after the 3rd section or at the end if fewer sections */}
                    {(index === 2 || (index === sections.length - 1 && sections.length <= 2)) && <CTAButton />}
                  </div>
                ));
              })()}
            </motion.div>

            {/* Excerpt as intro if no rich content */}
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

             {/* Related Articles Section */}
             {relatedArticles.length > 0 && (
               <section className="mt-16 border-t pt-12">
                 <h2 className="text-2xl font-display font-bold mb-8">Related Articles</h2>
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                   {relatedArticles.map((article) => (
                     <Link
                       key={article.id}
                       to={`/blog/${article.slug}`}
                       className="group block"
                     >
                       <div className="aspect-[16/9] overflow-hidden rounded-xl bg-muted mb-4">
                         {article.featured_image ? (
                           <img
                             src={article.featured_image}
                             alt={article.title}
                             className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                             loading="lazy"
                           />
                         ) : (
                           <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                             No image
                           </div>
                         )}
                       </div>
                       <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                         {article.title}
                       </h3>
                       <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">
                         {article.excerpt}
                       </p>
                     </Link>
                   ))}
                 </div>
               </section>
             )}

             {/* Smart Internal Linking Section (Fallback/Additional) */}
             {relatedArticles.length === 0 && (
               <InternalLinkBridge
                 currentPostId={post.id}
                 currentCategory={post.category}
                 currentTags={post.tags || []}
                 variant="end"
                 maxSuggestions={3}
               />
             )}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
