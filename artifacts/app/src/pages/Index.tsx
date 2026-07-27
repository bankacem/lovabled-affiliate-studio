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
