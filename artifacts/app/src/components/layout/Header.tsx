import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to={langPrefix("/")} className="flex items-center gap-2">
          <img 
            src={logoImage} 
            alt="AIPrintVerse Logo" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-display text-xl font-semibold text-foreground">
            AIPrintVerse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const resolvedPath = langPrefix(link.path);
            const isActive =
              location.pathname === resolvedPath ||
              (link.path !== "/" && location.pathname.includes(link.path));

            return (
              <Link
                key={link.path}
                to={resolvedPath}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons & Language Switcher */}
        <div className="hidden md:flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="bg-secondary text-foreground text-xs rounded-lg px-2.5 py-1.5 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            aria-label="Change language"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="fr">🇫🇷 FR</option>
          </select>

          <Link to={langPrefix("/designs")}>
            <Button variant="coral" size="sm">
              {t("nav.browse")}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="bg-secondary text-foreground text-xs rounded-lg px-2 py-1 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            aria-label="Change language"
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="fr">🇫🇷 FR</option>
          </select>

          <button
            className="p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container mx-auto flex flex-col gap-2 p-4">
              {navLinks.map((link) => {
                const resolvedPath = langPrefix(link.path);
                const isActive =
                  location.pathname === resolvedPath ||
                  (link.path !== "/" && location.pathname.includes(link.path));

                return (
                  <Link
                    key={link.path}
                    to={resolvedPath}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Link to={langPrefix("/designs")} onClick={() => setIsMenuOpen(false)} className="w-full">
                <Button variant="coral" className="mt-2 w-full">
                  {t("nav.browse")}
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
