import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedDesigns } from "@/components/home/FeaturedDesigns";
import { CategorySection } from "@/components/home/CategorySection";
import { LatestPosts } from "@/components/home/LatestPosts";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { language, t } = useLanguage();

  const canonicalUrl = language === "en"
    ? "https://aiprintverse.com/"
    : `https://aiprintverse.com/${language}`;

  return (
    <Layout>
      <Helmet>
        <title>{t("meta.homeTitle")}</title>
        <meta name="description" content={t("meta.homeDesc")} />
        {language !== "en" && (
          // Content on this locale route is UI-translated only; the underlying
          // copy is still English. Keep it out of the index until real
          // per-language content exists, to avoid thin/duplicate-content pages.
          <meta name="robots" content="noindex, follow" />
        )}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <HeroSection />
      <FeaturedDesigns />
      <CategorySection />
      <LatestPosts />
    </Layout>
  );
};

export default Index;
