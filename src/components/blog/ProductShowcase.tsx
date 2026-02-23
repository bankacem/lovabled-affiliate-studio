import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ProductShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/50 to-background p-8 shadow-sm"
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <ShoppingBag className="h-3.5 w-3.5" />
            Editor's Choice
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground">
            Shop This Look: 2026 Premium Collection
          </h3>
          <p className="text-muted-foreground">
            Love the designs mentioned in this guide? Our premium 2026 collection features these styles on ultra-soft sustainable fabrics.
          </p>
          <Button asChild className="rounded-full shadow-lg shadow-primary/20">
            <Link to="/designs">
              Browse the Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="w-full md:w-1/3 aspect-square rounded-2xl bg-secondary flex items-center justify-center p-4">
           <div className="grid grid-cols-2 gap-2 w-full h-full">
             <div className="rounded-lg bg-background/50 animate-pulse" />
             <div className="rounded-lg bg-background/50 animate-pulse" />
             <div className="rounded-lg bg-background/50 animate-pulse" />
             <div className="rounded-lg bg-background/50 animate-pulse" />
           </div>
        </div>
      </div>
    </motion.div>
  );
}
