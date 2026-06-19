import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedDesigns } from "@/components/home/FeaturedDesigns";
import { CategorySection } from "@/components/home/CategorySection";
import { LatestPosts } from "@/components/home/LatestPosts";

const Index = () => {
  return (
    <Layout>
      <Helmet>
        <title>AIPrintVerse | تصاميم الطباعة عند الطلب المدعومة بالذكاء الاصطناعي</title>
        <meta name="description" content="اكتشف تصاميم الطباعة عند الطلب المنسقة بواسطة الذكاء الاصطناعي للقمصان، الأكواب، الملصقات والمزيد. تسوق أعمالاً فنية فريدة على TeePublic و Redbubble." />
        <link rel="canonical" href="https://aiprintverse.com/" />
      </Helmet>
      <HeroSection />
      <FeaturedDesigns />
      <CategorySection />
      <LatestPosts />
    </Layout>
  );
};

export default Index;
