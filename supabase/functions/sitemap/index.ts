import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE = 1000;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
}

async function fetchAll(supabase: any, table: string, selectCols: string, filters?: (q: any) => any) {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(selectCols).range(from, from + PAGE_SIZE - 1);
    if (filters) query = filters(query);
    const { data, error } = await query;
    if (error) { console.error(`Error fetching ${table}:`, error); break; }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Generating sitemap...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = "https://aiprintverse.com";

    // Fetch ALL published blog posts with pagination
    const posts = await fetchAll(supabase, "blog_posts", "slug, updated_at, published_at", (q) =>
      q.eq("status", "published").order("published_at", { ascending: false })
    );
    console.log(`Found ${posts.length} published posts`);

    // Fetch ALL designs with pagination
    const designs = await fetchAll(supabase, "designs", "slug, name, updated_at", (q) =>
      q.order("updated_at", { ascending: false })
    );
    console.log(`Found ${designs.length} designs`);

    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/designs", priority: "0.9", changefreq: "daily" },
      { path: "/blog", priority: "0.9", changefreq: "daily" },
      { path: "/about", priority: "0.5", changefreq: "monthly" },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const post of posts) {
      if (!post.slug) continue;
      // Sanitize slug to ensure no XML-breaking characters
      const safeSlug = escapeXml(post.slug);
      const dateStr = post.published_at || post.updated_at;
      const lastmod = dateStr ? dateStr.split("T")[0] : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/${safeSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    for (const design of designs) {
      const slug = design.slug || design.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (!slug) continue;
      // Sanitize slug
      const safeSlug = escapeXml(slug);
      const lastmod = design.updated_at ? design.updated_at.split("T")[0] : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/designs/${safeSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += "</urlset>";

    console.log(`Sitemap generated: ${posts.length} posts + ${designs.length} designs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sitemap" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
