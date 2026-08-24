import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";
import { useLanguage, Language } from "@/contexts/LanguageContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { language, changeLanguage, t } = useLanguage();

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.designs"), path: "/designs" },
    { name: t("nav.blog"), path: "/blog" },
    { name: t("nav.about"), path: "/about" },
  ];

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };

  const isActive = (path: string) => {
    const resolvedPath = langPrefix(path);
    return location.pathname === resolvedPath || (path !== "/" && location.pathname.includes(path));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#f8f6f1]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#111318]/90">
      <div className="container mx-auto flex h-[76px] items-center justify-between px-4 md:px-6">
        <Link to={langPrefix("/")} className="group flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-[#111318] shadow-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
            <img src={logoImage} alt="AIPrintVerse Logo" className="h-8 w-8 rounded-full object-cover" />
          </span>
          <span className="font-display text-[1.15rem] font-semibold tracking-[-0.03em] text-[#111318] dark:text-white">
            AIPrintVerse<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-black/5 bg-white/70 p-1 shadow-sm md:flex dark:border-white/10 dark:bg-white/5">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={langPrefix(link.path)}
              className={cn(
                "relative rounded-full px-4 py-2 text-[0.8rem] font-semibold transition-all duration-300",
                isActive(link.path)
                  ? "bg-[#111318] text-white shadow-md dark:bg-white dark:text-[#111318]"
                  : "text-[#6c6b70] hover:bg-black/5 hover:text-[#111318] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="rounded-full border border-black/10 bg-transparent px-3 py-2 text-xs font-semibold text-[#111318] outline-none transition-colors hover:border-primary dark:border-white/15 dark:text-white"
            aria-label="Change language"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="fr">🇫🇷 FR</option>
          </select>
          <Link to={langPrefix("/designs")}>
            <Button variant="coral" size="sm" className="rounded-full px-5 shadow-md shadow-primary/20">
              {t("nav.browse")}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="rounded-full border border-black/10 bg-transparent px-2 py-1.5 text-[0.68rem] font-semibold outline-none dark:border-white/15 dark:text-white"
            aria-label="Change language"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="fr">🇫🇷 FR</option>
          </select>
          <button
            className="rounded-full border border-black/10 p-2 text-[#111318] transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-black/5 bg-[#f8f6f1] px-4 pb-5 pt-3 dark:border-white/10 dark:bg-[#111318] md:hidden"
          >
            <nav className="container mx-auto flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={langPrefix(link.path)}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors",
                    isActive(link.path)
                      ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318]"
                      : "text-[#6c6b70] hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link to={langPrefix("/designs")} onClick={() => setIsMenuOpen(false)} className="mt-2">
                <Button variant="coral" className="w-full rounded-full">
                  {t("nav.browse")}
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
