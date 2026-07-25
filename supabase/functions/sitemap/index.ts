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
      const rawPosts = await fetchAll<{ slug: string | null; updated_at: string; featured_image: string | null; title: string | null }>(
        supabase, "blog_posts", "slug, updated_at, featured_image, title",
        (q) => q.eq("status", "published").order("updated_at", { ascending: false }),
      );
      const posts = rawPosts.filter((p) => p && p.slug && p.slug.trim() !== "" && p.slug !== "null" && p.slug !== "undefined");
      for (const p of posts) {
        const lastmod = new Date(p.updated_at).toISOString().split("T")[0];
        xml += `  <url>\n    <loc>${BASE_URL}/blog/${escapeXml(p.slug!)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
        if (p.featured_image) {
          xml += `    <image:image>\n      <image:loc>${escapeXml(p.featured_image)}</image:loc>\n      <image:title>${escapeXml(p.title || "")}</image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }
    } else if (kind === "designs") {
      const rawDesigns = await fetchAll<{ id: string; name: string | null; image_url: string | null; updated_at: string | null }>(
        supabase, "designs", "id, name, image_url, updated_at", (q) => q.order("updated_at", { ascending: false }),
      );
      const designs = rawDesigns.filter((d) => d && d.id && d.name && d.name.trim() !== "" && d.image_url && d.image_url.trim() !== "");
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
