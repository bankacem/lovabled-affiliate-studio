import { Instagram, Mail, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language, t } = useLanguage();
  const langPrefix = (path: string) => language === "en" ? path : `/${language}${path === "/" ? "" : path}`;

  return (
    <footer className="border-t border-black/5 bg-[#111318] text-white dark:border-white/10">
      <div className="container mx-auto px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div className="max-w-sm space-y-5">
            <Link to={langPrefix("/")} className="group flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-white"><img src={logoImage} alt="AIPrintVerse Logo" className="h-8 w-8 rounded-full object-cover" /></span>
              <span className="font-display text-xl font-semibold tracking-[-0.03em]">AIPrintVerse<span className="text-primary">.</span></span>
            </Link>
            <p className="text-sm leading-6 text-white/55">{t("footer.brandDesc")}</p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://www.instagram.com/printverse_crafts/?hl=en" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/65 transition-colors hover:border-primary hover:bg-primary hover:text-white" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
              <a href="mailto:hello@aiprintverse.com" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/65 transition-colors hover:border-primary hover:bg-primary hover:text-white" aria-label="Email"><Mail className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3 text-sm"><li><Link to={langPrefix("/designs")} className="text-white/65 transition-colors hover:text-primary">{t("footer.allDesigns")}</Link></li><li><Link to={langPrefix("/blog")} className="text-white/65 transition-colors hover:text-primary">{t("footer.blog")}</Link></li><li><Link to={langPrefix("/about")} className="text-white/65 transition-colors hover:text-primary">{t("footer.aboutUs")}</Link></li></ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{t("footer.categories")}</h4>
            <ul className="space-y-3 text-sm"><li><Link to={langPrefix("/designs?category=T-Shirts")} className="text-white/65 transition-colors hover:text-primary">{t("categories.tshirts")}</Link></li><li><Link to={langPrefix("/designs?category=Hoodies")} className="text-white/65 transition-colors hover:text-primary">{t("categories.hoodies")}</Link></li><li><Link to={langPrefix("/designs?category=Mugs")} className="text-white/65 transition-colors hover:text-primary">{t("categories.mugs")}</Link></li><li><Link to={langPrefix("/designs?category=Stickers")} className="text-white/65 transition-colors hover:text-primary">{t("categories.stickers")}</Link></li></ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white/45">A note from us</h4>
            <p className="text-sm leading-6 text-white/65">Print the things that make your world feel more like yours.</p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>{t("footer.rights")}</p>
          <div className="flex flex-wrap items-center gap-4"><p>{t("footer.affiliateDisclosure")}</p><Link to={langPrefix("/admin")} className="opacity-35 transition-opacity hover:opacity-100" aria-label="Admin"><Settings className="h-4 w-4" /></Link></div>
        </div>
      </div>
    </footer>
  );
}
