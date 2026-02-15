import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SitemapEntry {
  id: string;
  slug?: string;
  updated_at: string;
}

export function useSitemapData() {
  const [posts, setPosts] = useState<SitemapEntry[]>([]);
  const [designs, setDesigns] = useState<SitemapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: postsData } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      const { data: designsData } = await supabase
        .from("designs")
        .select("id, updated_at")
        .order("updated_at", { ascending: false });

      if (postsData) {
        setPosts(postsData.map(p => ({ id: p.slug, slug: p.slug, updated_at: p.updated_at })));
      }
      if (designsData) {
        setDesigns(designsData);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { posts, designs, isLoading };
}

export function generateSitemapXml(posts: SitemapEntry[], designs: SitemapEntry[], baseUrl: string): string {
  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/designs", priority: "0.9", changefreq: "daily" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/about", priority: "0.5", changefreq: "monthly" },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  const today = new Date().toISOString().split("T")[0];
  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // Blog posts
  posts.forEach((post) => {
    const lastmod = new Date(post.updated_at).toISOString().split("T")[0];
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  // Designs
  designs.forEach((design) => {
    const lastmod = new Date(design.updated_at).toISOString().split("T")[0];
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/designs/${design.id}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += "</urlset>";
  return xml;
}

// Component to display sitemap (for debugging)
export function SitemapPage() {
  const { posts, designs, isLoading } = useSitemapData();
  const baseUrl = "https://aiprintverse.com";

  if (isLoading) {
    return <div>Loading sitemap...</div>;
  }

  const xml = generateSitemapXml(posts, designs, baseUrl);

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        padding: "20px",
        backgroundColor: "#f5f5f5",
      }}
    >
      {xml}
    </pre>
  );
}
