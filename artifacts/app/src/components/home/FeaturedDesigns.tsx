import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DesignCard } from "@/components/designs/DesignCard";
import { useFeaturedDesigns } from "@/hooks/useDesigns";

export function FeaturedDesigns() {
  const { data: featuredDesigns = [], isLoading } = useFeaturedDesigns();

  return (
    <section className="bg-[#f8f6f1] py-20 dark:bg-[#111318] md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 border-b border-black/10 pb-7 dark:border-white/10 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">The collection</p>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.055em] text-[#111318] dark:text-white md:text-5xl">Designed to be noticed.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#6c6b70] dark:text-white/60 md:text-base">Our most-loved designs, curated for the pieces you reach for every day.</p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full border-black/10 bg-white/50 px-5 dark:border-white/15 dark:bg-white/5">
            <Link to="/designs">View all designs <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </motion.div>

        <div className="mt-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : featuredDesigns.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDesigns.map((design, index) => <DesignCard key={design.id} design={design} index={index} />)}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[1.8rem] bg-[#172033] px-6 py-12 text-white shadow-2xl shadow-[#111318]/10 md:px-10 md:py-14">
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#dbe3f3]/20 blur-3xl" />
              <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">The archive is growing</p>
                  <h3 className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight tracking-[-0.045em] md:text-4xl">Find the piece that feels like you.</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/65">Explore the full collection of print-ready ideas across apparel, gifts, and everyday objects.</p>
                </div>
                <Button asChild variant="coral" className="w-fit rounded-full px-5 shadow-lg shadow-primary/20"><Link to="/designs">Browse the collection <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
