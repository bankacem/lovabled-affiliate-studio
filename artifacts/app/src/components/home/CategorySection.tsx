import { motion } from "framer-motion";
import { ArrowUpRight, Coffee, Shirt, Smartphone, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function CategorySection() {
  const { language, t } = useLanguage();

  const categories = [
    { name: "T-Shirts", displayName: t("categories.tshirts"), icon: Shirt, count: 4, tone: "bg-[#f8ddd6] text-[#bd5b51]" },
    { name: "Mugs", displayName: t("categories.mugs"), icon: Coffee, count: 1, tone: "bg-[#f6e8bd] text-[#aa7a20]" },
    { name: "Stickers", displayName: t("categories.stickers"), icon: StickyNote, count: 1, tone: "bg-[#d8eadf] text-[#3f8260]" },
    { name: "Phone Cases", displayName: t("categories.phoneCases"), icon: Smartphone, count: 1, tone: "bg-[#dbe3f3] text-[#5673a6]" },
  ];

  const langPrefix = (path: string) => language === "en" ? path : `/${language}${path}`;

  return (
    <section className="bg-white py-20 dark:bg-[#171a20] md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Find your format</p>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#111318] dark:text-white md:text-5xl">One idea. Every surface.</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#6c6b70] dark:text-white/60 md:justify-self-end md:text-base">From the everyday tee to the little sticker that starts a conversation, choose the canvas that fits your point of view.</p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <motion.div key={category.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.07 }}>
              <Link to={langPrefix(`/designs?category=${category.name}`)} className="group relative block overflow-hidden rounded-[1.6rem] border border-black/5 bg-[#f8f6f1] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-[#111318]">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${category.tone}`}><category.icon className="h-6 w-6" /></div>
                  <ArrowUpRight className="h-5 w-5 text-[#9b9aa0] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div className="mt-12">
                  <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-[#111318] dark:text-white">{category.displayName}</h3>
                  <p className="mt-1 text-sm text-[#6c6b70] dark:text-white/55">{category.count} {t("categories.designsCount")}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
