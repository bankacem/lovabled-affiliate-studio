import { motion } from "framer-motion";
import { ArrowUpRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BlogCard } from "@/components/blog/BlogCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useLanguage } from "@/contexts/LanguageContext";

export function LatestPosts() {
  const { language, t } = useLanguage();
  const { posts, isLoading } = useBlogPosts(1, 3);

  const langPrefix = (path: string) => language === "en" ? path : `/${language}${path}`;

  return (
    <section className="bg-[#f8f6f1] py-20 dark:bg-[#111318] md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col gap-6 border-b border-black/10 pb-7 dark:border-white/10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">From the journal</p>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.055em] text-[#111318] dark:text-white md:text-5xl">Ideas worth wearing.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c6b70] dark:text-white/60 md:text-base">{t("blog.subtitle")}</p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full border-black/10 bg-white/50 px-5 dark:border-white/15 dark:bg-white/5">
            <Link to={langPrefix("/blog")}>Explore the journal <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </motion.div>

        <div className="mt-10">
          {isLoading ? (
            <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /><p className="mt-4 text-sm text-[#6c6b70] dark:text-white/60">Loading posts...</p></div>
          ) : posts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post, index) => <BlogCard key={post.id} post={post} index={index} />)}</div>
          ) : (
            <div className="rounded-3xl border border-dashed border-black/15 py-16 text-center dark:border-white/15"><FileText className="mx-auto mb-4 h-10 w-10 text-primary" /><p className="text-sm text-[#6c6b70] dark:text-white/60">{t("blog.adjustSearch")}</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
