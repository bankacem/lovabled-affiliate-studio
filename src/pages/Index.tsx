import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedDesigns } from "@/components/home/FeaturedDesigns";
import { CategorySection } from "@/components/home/CategorySection";
import { LatestPosts } from "@/components/home/LatestPosts";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedDesigns />
      <CategorySection />
      <LatestPosts />
    </Layout>
  );
};

export default Index;
