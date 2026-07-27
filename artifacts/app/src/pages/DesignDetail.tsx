import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/designs/DesignCard";
import { useDesign, useDesigns } from "@/hooks/useDesigns";
import { calculateQualityScore } from "@/lib/seoAudit";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const DesignDetail = () => {
  const { id } = useParams();
  const { data: design, isLoading } = useDesign(id || "");
  const { data: allDesigns = [] } = useDesigns();
  const { language, t } = useLanguage();

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };

  const relatedDesigns = allDesigns
    .filter((d) => d.category === design?.category && d.id !== design?.id)
    .slice(0, 4);

  const isLowQuality = useMemo(() => {
    if (!design) return false;
    const score = calculateQualityScore(design, "design");
    return score < 60;
  }, [design]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: design?.name,
        text: design?.description || "",
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("designs.copied"));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!design) {
    return (
      <Layout>
        <Helmet>
          <title>{t("designs.notFound")} | AIPrintVerse</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("designs.notFound")}
          </h1>
          <Button asChild variant="outline" className="mt-4">
            <Link to={langPrefix("/designs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("designs.backToDesigns")}
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const designTitle = `${design.name} | AIPrintVerse`;
  const designDesc = (design.description || `تسوق ${design.name} - تصميم فريد ${design.category} للطباعة عند الطلب على القمصان، الأكواب، الملصقات والمزيد في AIPrintVerse.`).slice(0, 160);
  const designUrl = `https://aiprintverse.com/designs/${design.id}`;

  return (
    <Layout>
      {/* SEO */}
      <Helmet>
        <title>{designTitle}</title>
        <meta name="description" content={designDesc} />
        {isLowQuality && <meta name="robots" content="noindex, nofollow" />}
        <meta property="og:title" content={designTitle} />
        <meta property="og:description" content={designDesc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={designUrl} />
        {design.image_url && <meta property="og:image" content={design.image_url} />}
        <link rel="canonical" href={designUrl} />
      </Helmet>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Link
              to={langPrefix("/designs")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("designs.backToDesigns")}
            </Link>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-hidden rounded-2xl bg-secondary shadow-lg">
                <img
                  src={design.image_url}
                  alt={design.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/600?text=Design";
                  }}
                />
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-primary">
                    {design.category}
                  </span>
                  <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                    {design.name}
                  </h1>
                </div>
                <button
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {design.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {design.description}
                </p>
              )}

              {/* Tags */}
              {design.tags && design.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {design.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {design.teepublic_url && (
                  <Button
                    asChild
                    variant="coral"
                    size="lg"
                    className="flex-1 min-w-[140px]"
                  >
                    <a
                      href={design.teepublic_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("designs.viewTeePublic")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {design.redbubble_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[140px]"
                  >
                    <a
                      href={design.redbubble_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("designs.viewRedbubble")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {design.amazon_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[140px] border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <a
                      href={design.amazon_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("designs.viewAmazon")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {design.etsy_url && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[140px] border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    <a
                      href={design.etsy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("designs.viewEtsy")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Affiliate Notice */}
              <p className="mt-6 text-xs text-muted-foreground">
                {t("designs.affiliateDisclosure")}
              </p>
            </motion.div>
          </div>

          {/* Related Designs */}
          {relatedDesigns.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("designs.related")}
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedDesigns.map((design, index) => (
                  <DesignCard key={design.id} design={design} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DesignDetail;
