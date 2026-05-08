import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/designs/DesignCard";
import { useFeaturedDesigns } from "@/hooks/useDesigns";

export function FeaturedDesigns() {
  const { data: featuredDesigns = [], isLoading } = useFeaturedDesigns();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-between gap-4 md:flex-row"
        >
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Featured Designs
            </h2>
            <p className="mt-2 text-muted-foreground">
              Our most popular designs this month
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/designs">
              View All Designs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="mt-10">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : featuredDesigns.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDesigns.map((design, index) => (
                <DesignCard key={design.id} design={design} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No featured designs yet
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
