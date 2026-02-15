import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/layout/SEO";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/designs/DesignCard";
import { useDesign, useDesigns } from "@/hooks/useDesigns";
import { toast } from "sonner";

const DesignDetail = () => {
  const { id } = useParams();
  const { data: design, isLoading } = useDesign(id || "");
  const { data: allDesigns = [] } = useDesigns();

  const relatedDesigns = allDesigns
    .filter((d) => d.category === design?.category && d.id !== design?.id)
    .slice(0, 4);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: design?.name,
        text: design?.description || "",
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
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!design) {
    return (
      <Layout>
        <SEO title="Design Not Found" noindex={true} />
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Design Not Found
          </h1>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/designs">
              <ArrowLeft className="h-4 w-4" />
              Back to Designs
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={design.name}
        description={design.description || `Check out ${design.name} - unique ${design.category} design at AIPrintVerse.`}
        canonical={`/designs/${design.id}`}
        ogImage={design.image_url}
        ogType="product"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": design.name,
          "image": [design.image_url],
          "description": design.description || `Unique ${design.category} design`,
          "brand": {
            "@type": "Brand",
            "name": "AIPrintVerse"
          },
          "offers": {
            "@type": "AggregateOffer",
            "offerCount": (design.teepublic_url ? 1 : 0) + (design.redbubble_url ? 1 : 0) + (design.amazon_url ? 1 : 0) + (design.etsy_url ? 1 : 0),
            "lowPrice": "14.99",
            "highPrice": "45.00",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        })}
      </script>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Link
              to="/designs"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Designs
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
                  {design.tags.map((tag) => (
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
                      View on TeePublic
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
                      View on Redbubble
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
                      View on Amazon
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
                      View on Etsy
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Affiliate Notice */}
              <p className="mt-6 text-xs text-muted-foreground">
                * Disclosure: We may earn a commission from purchases through these links at no extra cost to you.
              </p>
            </motion.div>
          </div>

          {/* Product Details - Extra Content for SEO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 grid gap-8 lg:grid-cols-3"
          >
            <div className="rounded-2xl border border-border/50 bg-card p-6 p-shadow-sm">
              <h3 className="font-display text-xl font-bold text-foreground">Design Info</h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                This unique <span className="text-primary font-medium">{design.category}</span> design titled <span className="text-primary font-medium">"{design.name}"</span> is a custom-curated piece by AIPrintVerse. Perfect for expressing your unique style through high-quality print-on-demand merchandise.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-6 p-shadow-sm">
              <h3 className="font-display text-xl font-bold text-foreground">Printing & Quality</h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Available on multiple platforms like TeePublic and Redbubble, ensuring the highest print quality on various products. Whether it's a T-shirt, mug, or sticker, you can expect vibrant colors and durable materials.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-6 p-shadow-sm">
              <h3 className="font-display text-xl font-bold text-foreground">Why AIPrintVerse?</h3>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                We use advanced AI technology to curate and refine the best designs in the market. Our goal is to provide art that resonates with trending styles while maintaining a high level of artistic integrity.
              </p>
            </div>
          </motion.div>

          {/* Related Designs */}
          {relatedDesigns.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Related Designs
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