import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail, Settings } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language, t } = useLanguage();

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
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
            <p className="text-sm text-muted-foreground">
              {t("footer.brandDesc")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={langPrefix("/designs")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.allDesigns")}
                </Link>
              </li>
              <li>
                <Link to={langPrefix("/blog")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.blog")}
                </Link>
              </li>
              <li>
                <Link to={langPrefix("/about")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("footer.aboutUs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              {t("footer.categories")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={langPrefix("/designs?category=T-Shirts")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("categories.tshirts")}
                </Link>
              </li>
              <li>
                <Link to={langPrefix("/designs?category=Hoodies")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("categories.hoodies")}
                </Link>
              </li>
              <li>
                <Link to={langPrefix("/designs?category=Mugs")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("categories.mugs")}
                </Link>
              </li>
              <li>
                <Link to={langPrefix("/designs?category=Stickers")} className="text-muted-foreground hover:text-primary transition-colors">
                  {t("categories.stickers")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              {t("footer.connect")}
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>{t("footer.rights")}</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <p className="text-xs">
                {t("footer.affiliateDisclosure")}
              </p>
              <Link 
                to={langPrefix("/admin")}
                className="opacity-30 hover:opacity-100 transition-opacity"
                aria-label="Admin"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
