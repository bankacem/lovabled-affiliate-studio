import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/designs/DesignCard";
import { designs } from "@/data/designs";
import { toast } from "sonner";

const DesignDetail = () => {
  const { id } = useParams();
  const design = designs.find((d) => d.id === id);

  if (!design) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center md:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Design not found
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

  const relatedDesigns = designs
    .filter((d) => d.category === design.category && d.id !== design.id)
    .slice(0, 4);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: design.name,
        text: design.description,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Layout>
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
                  src={design.imageUrl}
                  alt={design.name}
                  className="h-full w-full object-cover"
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

              <p className="mt-4 text-muted-foreground leading-relaxed">
                {design.description}
              </p>

              {/* Tags */}
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

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  variant="coral"
                  size="lg"
                  className="flex-1"
                >
                  <a
                    href={design.teepublicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on TeePublic
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <a
                    href={design.redbubbleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Redbubble
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* Affiliate Notice */}
              <p className="mt-6 text-xs text-muted-foreground">
                * Affiliate Disclosure: We may earn a commission from purchases
                made through these links at no extra cost to you.
              </p>
            </motion.div>
          </div>

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
