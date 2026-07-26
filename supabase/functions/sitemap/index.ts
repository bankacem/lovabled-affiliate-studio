import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://aiprintverse.com";
const PAGE_SIZE = 1000;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function cleanHtmlText(html: string): string {
  if (!html) return "";
  let clean = html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

function calculateQualityScore(page: any, type: "blog" | "design"): number {
  let score = 100;

  if (type === "blog") {
    const title = (page.title || "").trim();
    if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
      score -= 40;
    }
    const content = page.content || "";
    const cleanText = cleanHtmlText(content);
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 100;
    } else if (wordCount < 250) {
      score -= 45;
    } else if (wordCount < 500) {
      score -= 30;
    } else if (wordCount < 800) {
      score -= 15;
    }

    const cleanLower = cleanText.toLowerCase();
    const placeholders = ["lorem ipsum", "placeholder", "todo", "insert here", "text goes here", "[insert", "[your"];
    if (placeholders.some(p => cleanLower.includes(p))) {
      score -= 25;
    }

    const metaDesc = (page.meta_description || "").trim();
    if (!metaDesc) {
      score -= 15;
    } else if (metaDesc.length < 80) {
      score -= 5;
    }

    const ogImage = page.featured_image || page.image_url || "";
    if (!ogImage || !ogImage.startsWith("http")) {
      score -= 15;
    }

    if (!page.author_name) {
      score -= 10;
    }
  } else if (type === "design") {
    const name = (page.name || "").trim();
    if (!name || name.toLowerCase().includes("untitled") || name.toLowerCase() === "no name") {
      score -= 40;
    }

    const desc = page.description || "";
    const cleanDesc = cleanHtmlText(desc);
    const words = cleanDesc.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 40;
    } else if (wordCount < 30) {
      score -= 25;
    } else if (wordCount < 80) {
      score -= 10;
    }

    const imageUrl = page.image_url || "";
    if (!imageUrl || !imageUrl.startsWith("http")) {
      score -= 40;
    }

    const hasStoreLink = !!(page.teepublic_url || page.redbubble_url || page.amazon_url || page.etsy_url);
    if (!hasStoreLink) {
      score -= 30;
    }

    const tags = page.tags || [];
    if (tags.length === 0) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

async function fetchAll<T>(supabase: ReturnType<typeof createClient>, table: string, select: string, filter?: (q: any) => any): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    let q: any = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

function xmlHeader(withImage = false): string {
  const imgNs = withImage ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imgNs}>\n`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop() || "";
  // Support: /sitemap (index), /sitemap-pages.xml, /sitemap-posts.xml, /sitemap-designs.xml
  const kind = url.searchParams.get("kind") ||
    (path.includes("posts") ? "posts" : path.includes("designs") ? "designs" : path.includes("pages") ? "pages" : "index");

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Sitemap index
    if (kind === "index") {
      const now = new Date().toISOString().split("T")[0];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-posts.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-designs.xml</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`;
      return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml", "Cache-Control": "public, max-age=1800" } });
    }

    let xml = xmlHeader(kind === "posts");

    if (kind === "pages") {
      const now = new Date().toISOString().split("T")[0];
      const pages = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/blog", priority: "0.9", changefreq: "daily" },
        { path: "/designs", priority: "0.9", changefreq: "weekly" },
        { path: "/about", priority: "0.5", changefreq: "monthly" },
      ];
      for (const p of pages) {
        xml += `  <url><loc>${BASE_URL}${p.path}</loc><lastmod>${now}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`;
      }
    } else if (kind === "posts") {
      const rawPosts = await fetchAll<{
        slug: string | null;
        updated_at: string;
        featured_image: string | null;
        title: string | null;
        content: string | null;
        meta_description: string | null;
        author_name: string | null;
      }>(
        supabase, "blog_posts", "slug, updated_at, featured_image, title, content, meta_description, author_name",
        (q) => q.eq("status", "published").order("updated_at", { ascending: false }),
      );

      const posts = rawPosts.filter((p) => {
        if (!p || !p.slug || p.slug.trim() === "" || p.slug === "null" || p.slug === "undefined") return false;
        const score = calculateQualityScore(p, "blog");
        return score >= 60;
      });

      for (const p of posts) {
        const lastmod = new Date(p.updated_at).toISOString().split("T")[0];
        xml += `  <url>\n    <loc>${BASE_URL}/blog/${escapeXml(p.slug!)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
        if (p.featured_image) {
          xml += `    <image:image>\n      <image:loc>${escapeXml(p.featured_image)}</image:loc>\n      <image:title>${escapeXml(p.title || "")}</image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }
    } else if (kind === "designs") {
      const rawDesigns = await fetchAll<{
        id: string;
        name: string | null;
        image_url: string | null;
        updated_at: string | null;
        description: string | null;
        teepublic_url: string | null;
        redbubble_url: string | null;
        amazon_url: string | null;
        etsy_url: string | null;
        tags: string[] | null;
      }>(
        supabase, "designs", "id, name, image_url, updated_at, description, teepublic_url, redbubble_url, amazon_url, etsy_url, tags", (q) => q.order("updated_at", { ascending: false }),
      );

      const designs = rawDesigns.filter((d) => {
        if (!d || !d.id || !d.name || d.name.trim() === "" || !d.image_url || d.image_url.trim() === "") return false;
        const score = calculateQualityScore(d, "design");
        return score >= 60;
      });

      for (const d of designs) {
        const lastmod = new Date(d.updated_at || Date.now()).toISOString().split("T")[0];
        xml += `  <url><loc>${BASE_URL}/designs/${escapeXml(d.id)}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
      }
    }

    xml += "</urlset>";
    return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml", "Cache-Control": "public, max-age=1800" } });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(`<?xml version="1.0"?><error>${(error as Error).message}</error>`, {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
