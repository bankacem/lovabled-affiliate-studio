import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Design } from "@/data/designs";

interface DesignCardProps {
  design: Design;
  index?: number;
}

export function DesignCard({ design, index = 0 }: DesignCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/designs/${design.id}`}>
        <div className="overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <img
              src={design.imageUrl}
              alt={design.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {design.featured && (
              <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Featured
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-sm font-medium text-primary-foreground">
                View Details
              </span>
              <ExternalLink className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1">
              {design.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{design.category}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {design.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
