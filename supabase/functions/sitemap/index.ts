import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SitemapEntry {
  slug: string;
  updated_at: string;
  published_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Generating sitemap...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published blog posts
    // VERIFIED: This dynamic generation uses the SEO-friendly 'slug' field exclusively.
    // CRITICAL: We include ALL posts with 'published' status regardless of the timestamp.
    // We intentionally OMIT any .lte('published_at', now) filter to ensure that
    // posts published in any timezone (even those that might appear to be in the
    // "future" relative to the server's UTC clock) are included in the sitemap.
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5000); // Increase limit to ensure all posts are included

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} published posts`);

    const baseUrl = "https://aiprintverse.com";
    
    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/designs", priority: "0.9", changefreq: "daily" },
      { path: "/blog", priority: "0.9", changefreq: "daily" },
      { path: "/about", priority: "0.5", changefreq: "monthly" },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Add blog posts using new SEO-friendly slugs
    if (posts) {
      for (const post of posts) {
        // Use the date part directly from the timestamp string to stay as close as possible
        // to the intended publishing date, falling back to updated_at.
        const dateStr = post.published_at || post.updated_at;
        const lastmod = dateStr ? dateStr.split("T")[0] : new Date().toISOString().split("T")[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // Fetch designs
    const { data: designs } = await supabase
      .from("designs")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (designs) {
      console.log(`Found ${designs.length} designs`);
      for (const design of designs) {
        const lastmod = new Date(design.updated_at || new Date()).toISOString().split("T")[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/designs/${design.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += "</urlset>";

    console.log("Sitemap generated successfully");

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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
