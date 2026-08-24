import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function HeroSection() {
  const { language, t } = useLanguage();

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };

  return (
    <section className="relative overflow-hidden bg-[#f8f6f1] dark:bg-[#111318]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(240,112,102,0.18),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(38,64,110,0.10),transparent_26%)]" />
      <div className="absolute -right-32 top-20 h-72 w-72 rounded-full border border-primary/10 bg-primary/5 blur-3xl" />

      <div className="container relative mx-auto px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-20 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm dark:bg-white/5">
                <Sparkles className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-7 max-w-xl font-display text-[3.25rem] font-semibold leading-[0.98] tracking-[-0.065em] text-[#111318] dark:text-white sm:text-6xl lg:text-[5.35rem]"
            >
              {t("hero.titleStart")} <span className="relative inline-block text-primary">{t("hero.titleHighlight")}<span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-primary/20" /></span> {t("hero.titleEnd")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className="mt-7 max-w-lg text-base leading-7 text-[#6c6b70] dark:text-white/65 md:text-lg"
            >
              {t("hero.desc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild variant="coral" size="xl" className="group rounded-full px-7 shadow-xl shadow-primary/20">
                <Link to={langPrefix("/designs")}>
                  {t("hero.browseCTA")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full border-black/10 bg-white/60 px-7 dark:border-white/15 dark:bg-white/5">
                <Link to={langPrefix("/blog")}>{t("hero.blogCTA")}</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#6c6b70] dark:text-white/60"
            >
              {["Curated designs", "Print-ready quality", "Made for your style"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-primary"><Check className="h-3 w-3" /></span>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="relative mx-auto w-full max-w-[560px]"
          >
            <div className="relative aspect-[0.9/1] overflow-hidden rounded-[2rem] bg-[#172033] p-4 shadow-2xl shadow-[#111318]/20 sm:aspect-[1/0.96] sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(240,112,102,0.75),transparent_30%),linear-gradient(145deg,#253554,#111318_64%)]" />
              <div className="absolute -left-12 bottom-8 h-48 w-48 rounded-full border-[24px] border-[#f8f6f1]/10" />
              <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-white/20" />
              <div className="relative flex h-full flex-col justify-between rounded-[1.45rem] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
                <div className="flex items-start justify-between text-white/70">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em]">AIPrintVerse / 01</span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[0.65rem] uppercase tracking-[0.14em]">New drop</span>
                </div>
                <div>
                  <p className="max-w-[16rem] font-display text-4xl leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl">Wear the idea before it becomes ordinary.</p>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["#f6d4c7", "#c7d1e5", "#f0a197", "#e8ddbd"].map((color) => <span key={color} className="h-8 w-8 rounded-full border-2 border-[#273555]" style={{ backgroundColor: color }} />)}
                    </div>
                    <span className="text-xs text-white/65">+500 happy customers</span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/50">Explore the collection</p>
                    <p className="mt-1 text-sm font-semibold text-white">T-shirts · Mugs · Stickers</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f6f1] text-[#111318]"><ArrowRight className="h-5 w-5 -rotate-45" /></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/90 px-4 py-3 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#1a1d25]/90 sm:-left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1c9] text-[#bd8123]"><Star className="h-5 w-5 fill-current" /></span>
              <div><p className="text-sm font-bold text-[#111318] dark:text-white">4.9 / 5 rating</p><p className="text-xs text-[#6c6b70] dark:text-white/55">Loved by print lovers</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
