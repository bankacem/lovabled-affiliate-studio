import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { language, t } = useLanguage();

  const langPrefix = (path: string) => {
    if (language === "en") return path;
    return `/${language}${path === "/" ? "" : path}`;
  };

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.notFoundTitle")}</title>
        <meta name="description" content={t("meta.notFoundDesc")} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("notFound.title")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("notFound.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to={langPrefix("/")}>
                <Home className="h-4 w-4 mr-2" />
                {t("notFound.goHome")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={langPrefix("/blog")}>
                <Search className="h-4 w-4 mr-2" />
                {t("nav.blog")}
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Path: {location.pathname}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
