import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/layout/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedDesigns } from "@/components/home/FeaturedDesigns";
import { CategorySection } from "@/components/home/CategorySection";
import { LatestPosts } from "@/components/home/LatestPosts";

const Index = () => {
  return (
    <Layout>
      <SEO
        title="Home"
        description="Discover AI-curated print-on-demand designs for t-shirts, mugs, stickers and more. Shop unique artwork on TeePublic and Redbubble."
        canonical="/"
      />
      <HeroSection />
      <FeaturedDesigns />
      <CategorySection />
      <LatestPosts />
    </Layout>
  );
};

export default Index;
