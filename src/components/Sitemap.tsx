import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SitemapEntry {
  slug: string;
  updated_at: string;
}

export function useSitemapData() {
  const [posts, setPosts] = useState<SitemapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      if (data) {
        setPosts(data);
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, []);

  return { posts, isLoading };
}

export function generateSitemapXml(posts: SitemapEntry[], baseUrl: string): string {
  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/designs", priority: "0.9", changefreq: "weekly" },
    { path: "/about", priority: "0.5", changefreq: "monthly" },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
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
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += "</urlset>";
  return xml;
}

// Component to display sitemap (for debugging)
export function SitemapPage() {
  const { posts, isLoading } = useSitemapData();
  const baseUrl = window.location.origin;

  if (isLoading) {
    return <div>Loading sitemap...</div>;
  }

  const xml = generateSitemapXml(posts, baseUrl);

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
