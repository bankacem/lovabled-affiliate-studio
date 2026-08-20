import { useBlogIndex } from "@/hooks/useBlogPosts";

interface SitemapEntry {
  slug: string;
  updated_at: string;
  title?: string | null;
  content?: string | null;
  meta_description?: string | null;
  featured_image?: string | null;
  author_name?: string | null;
}

export function useSitemapData() {
  const result = useBlogIndex();
  const posts = (result.data?.posts ?? [])
    .filter((post) => post.status === "published" && Boolean(post.slug?.trim()))
    .map((post) => ({
      slug: post.slug,
      updated_at: post.updated_at || post.published_at || post.created_at || new Date().toISOString(),
      title: post.title,
      meta_description: post.meta_description,
      featured_image: post.featured_image,
      author_name: post.author_name,
    }));

  return { posts, isLoading: result.isLoading };
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

  const todayDate = new Date().toISOString().split("T")[0];
  staticPages.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${todayDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  const uniqueBySlug = new Map<string, SitemapEntry>();
  for (const post of posts) {
    if (!uniqueBySlug.has(post.slug)) uniqueBySlug.set(post.slug, post);
  }
  const cleanedPosts = [...uniqueBySlug.values()].filter((post) => {
    if (!post.slug.startsWith("p-")) return true;
    return !uniqueBySlug.has(post.slug.slice(2));
  });

  cleanedPosts.forEach((post) => {
    const lastmodDate = new Date(post.updated_at);
    const lastmod = Number.isNaN(lastmodDate.getTime()) ? todayDate : lastmodDate.toISOString().split("T")[0];
    const slug = post.slug.startsWith("p-") ? post.slug.slice(2) : post.slug;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/blog/${slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += "</urlset>";
  return xml;
}

export function SitemapPage() {
  const { posts, isLoading } = useSitemapData();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://aiprintverse.com";

  if (isLoading) return <div>Loading sitemap...</div>;

  return (
    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", padding: "20px", backgroundColor: "#f5f5f5" }}>
      {generateSitemapXml(posts, baseUrl)}
    </pre>
  );
}
