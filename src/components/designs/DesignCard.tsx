import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, Eye } from "lucide-react";
import type { Design } from "@/hooks/useDesigns";

interface DesignCardProps {
  design: Design;
  index?: number;
}

export function DesignCard({ design, index = 0 }: DesignCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link to={`/designs/${design.slug || design.id}`}>
        <div className="overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:shadow-xl hover:-translate-y-2 border border-border/50">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <img
              src={design.image_url}
              alt={design.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Design";
              }}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
            
            {/* Featured badge */}
            {design.featured && (
              <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                ⭐ Featured
              </div>
            )}

            {/* Source badge */}
            {design.source && (
              <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-lg ${
                design.source === 'redbubble' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-blue-500 text-white'
              }`}>
                {design.source === 'redbubble' ? 'RB' : 'TP'}
              </div>
            )}
            
            {/* Hover content */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 transition-all duration-300 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Eye className="h-4 w-4" />
                View Details
              </span>
              <ExternalLink className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {design.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{design.category}</p>
            
            {/* Tags */}
            {design.tags && design.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {design.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
