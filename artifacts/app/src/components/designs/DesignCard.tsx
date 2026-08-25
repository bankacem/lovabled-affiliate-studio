import { motion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Design } from "@/hooks/useDesigns";

interface DesignCardProps {
  design: Design;
  index?: number;
}

export function DesignCard({ design, index = 0 }: DesignCardProps) {
  const sourceLabel = design.source === "redbubble" ? "Redbubble" : design.source === "teepublic" ? "TeePublic" : null;

  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(index * 0.045, 0.36) }} className="group">
      <Link to={`/designs/${design.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f07167] focus-visible:ring-offset-4 dark:focus-visible:ring-offset-[#111318]">
        <div className="overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-focus-visible:-translate-y-1.5 group-focus-visible:shadow-xl dark:border-white/10 dark:bg-[#191b21]">
          <div className="relative aspect-[4/4.5] overflow-hidden bg-[#e9e5dc] dark:bg-white/10">
            <img src={design.image_url} alt={design.name} loading={index < 4 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]" onError={(event) => { event.currentTarget.src = "/logo.png"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17191e]/75 via-[#17191e]/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
            <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
              {design.featured ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#20232b] shadow-sm backdrop-blur"><Sparkles className="h-3 w-3 text-[#f07167]" />Featured</span> : <span />}
              {sourceLabel && <span className="rounded-full border border-white/20 bg-[#20232b]/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">{sourceLabel}</span>}
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">{design.category}</p><p className="mt-1 text-sm font-semibold">Explore this design</p></div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#20232b] transition-transform duration-300 group-hover:rotate-[-8deg]"><ArrowUpRight className="h-4 w-4" /></span>
            </div>
          </div>
          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3"><h2 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-[#20232b] transition-colors group-hover:text-[#c95b54] dark:text-white dark:group-hover:text-[#ff9a91]">{design.name}</h2><ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[#a5a1a3] transition-colors group-hover:text-[#f07167]" /></div>
            {design.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#77747a] dark:text-white/50">{design.description}</p>}
            {design.tags && design.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{design.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#f4f1eb] px-2.5 py-1 text-[11px] font-medium text-[#77747a] dark:bg-white/10 dark:text-white/55">{tag}</span>)}</div>}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
