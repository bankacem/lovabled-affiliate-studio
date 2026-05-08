 import { useMemo } from "react";
 import { Link } from "react-router-dom";
 import { motion } from "framer-motion";
 import { ArrowRight, Sparkles, TrendingUp, BookOpen } from "lucide-react";
 import { useSmartLinking } from "@/hooks/useSmartLinking";
 import { cn } from "@/lib/utils";
 
 interface InternalLinkBridgeProps {
   currentPostId: string;
   currentCategory: string;
   currentTags: string[];
   variant?: "end" | "inline" | "sidebar";
   maxSuggestions?: number;
   className?: string;
 }
 
 export function InternalLinkBridge({
   currentPostId,
   currentCategory,
   currentTags,
   variant = "end",
   maxSuggestions = 3,
   className,
 }: InternalLinkBridgeProps) {
   const { getSuggestions, isCurrentPageIndexed, isLoading } = useSmartLinking(currentPostId);
 
   const suggestions = useMemo(() => {
     const isIndexed = isCurrentPageIndexed(currentPostId);
     
     return getSuggestions(
       { category: currentCategory, tags: currentTags },
       { 
         limit: maxSuggestions, 
         prioritizePending: isIndexed, // Prioritize pending if current page is indexed
         excludeIds: [currentPostId] 
       }
     );
   }, [currentPostId, currentCategory, currentTags, maxSuggestions, getSuggestions, isCurrentPageIndexed]);
 
   if (isLoading || suggestions.length === 0) {
     return null;
   }
 
   // Get topic label from category or most common tag
   const topicLabel = currentCategory !== "General" 
     ? currentCategory 
     : (currentTags[0] || "Design");
 
   const containerStyles = {
     end: "mt-12 pt-8 border-t border-border",
     inline: "my-8 mx-auto max-w-2xl",
     sidebar: "sticky top-24",
   };
 
   const cardStyles = {
     end: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
     inline: "flex flex-col gap-3",
     sidebar: "flex flex-col gap-3",
   };
 
   return (
     <motion.section
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.3 }}
       className={cn(containerStyles[variant], className)}
       aria-labelledby="related-reads-heading"
     >
       {/* Header with CTA Style */}
       <div className="mb-6">
         <div className="flex items-center gap-2 mb-2">
           <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
             <Sparkles className="h-4 w-4 text-primary" />
           </div>
           <span className="text-xs font-medium uppercase tracking-wider text-primary">
             Recommended Reads
           </span>
         </div>
         <h3 
           id="related-reads-heading"
           className="text-xl md:text-2xl font-display font-bold text-foreground"
         >
           Explore More {topicLabel} Guides
         </h3>
         <p className="mt-2 text-muted-foreground">
           Continue your journey with our latest expert insights
         </p>
       </div>
 
       {/* Suggestions Grid/List */}
       <div className={cardStyles[variant]}>
         {suggestions.map((suggestion, index) => (
           <SuggestionCard
             key={suggestion.post.id}
             suggestion={suggestion}
             variant={variant}
             index={index}
           />
         ))}
       </div>
 
       {/* View All CTA */}
       <div className="mt-6 text-center">
         <Link
           to={`/blog?category=${encodeURIComponent(currentCategory)}`}
           className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
         >
           <span>View all {topicLabel} articles</span>
           <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
         </Link>
       </div>
     </motion.section>
   );
 }
 
 interface SuggestionCardProps {
   suggestion: {
     post: {
       id: string;
       title: string;
       slug: string;
       excerpt?: string;
       featured_image?: string;
       indexing_status: "indexed" | "pending";
     };
     matchReason: string[];
   };
   variant: "end" | "inline" | "sidebar";
   index: number;
 }
 
 function SuggestionCard({ suggestion, variant, index }: SuggestionCardProps) {
   const { post } = suggestion;
   const isPending = post.indexing_status === "pending";
 
   if (variant === "inline" || variant === "sidebar") {
     return (
       <motion.div
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: index * 0.1 }}
       >
         <Link
           to={`/blog/${post.slug}`}
           className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200"
         >
           {post.featured_image && (
             <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
               <img
                 src={post.featured_image}
                 alt=""
                 className="w-full h-full object-cover"
                 loading="lazy"
               />
             </div>
           )}
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
               {isPending && (
                 <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                   <TrendingUp className="h-3 w-3" />
                   New
                 </span>
               )}
             </div>
             <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
               {post.title}
             </h4>
           </div>
           <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 flex-shrink-0 mt-1" />
         </Link>
       </motion.div>
     );
   }
 
   // End variant - larger cards
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.1 }}
     >
       <Link
         to={`/blog/${post.slug}`}
         className="group block h-full rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
       >
         {/* Image */}
         {post.featured_image && (
           <div className="aspect-[16/9] overflow-hidden bg-muted">
             <img
               src={post.featured_image}
               alt=""
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
               loading="lazy"
             />
           </div>
         )}
         
         {/* Content */}
         <div className="p-4">
           {/* Badge */}
           {isPending && (
             <span className="inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
               <TrendingUp className="h-3 w-3" />
               Latest Guide
             </span>
           )}
           
           <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
             {post.title}
           </h4>
           
           {post.excerpt && (
             <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
               {post.excerpt}
             </p>
           )}
           
           {/* Read More */}
           <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
             <BookOpen className="h-4 w-4" />
             <span>Read article</span>
             <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
           </div>
         </div>
       </Link>
     </motion.div>
   );
 }