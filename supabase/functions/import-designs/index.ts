import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeUrl, source } = await req.json();

    if (!storeUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Store URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Scraping store: ${storeUrl} (source: ${source})`);

    // Use scrape endpoint to extract links and content from the shop page
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: storeUrl,
        formats: ["markdown", "links", "html"],
        onlyMainContent: false,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("Firecrawl scrape error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || "Failed to scrape store" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allLinks = scrapeData.data?.links || [];
    console.log(`Found ${allLinks.length} total links on page`);

    // Filter for product URLs based on the source
    let productUrls: string[] = [];

    if (source === "redbubble") {
      // Redbubble product URLs contain /i/ followed by product name
      productUrls = allLinks.filter((url: string) =>
        url.includes("redbubble.com") &&
        url.includes("/i/") &&
        !url.includes("/shop") &&
        !url.includes("/explore") &&
        !url.includes("/people/")
      );
    } else if (source === "teepublic") {
      // TeePublic product URLs contain product type patterns
      productUrls = allLinks.filter((url: string) =>
        url.includes("teepublic.com") &&
        (url.includes("/t-shirt/") ||
          url.includes("/mug/") ||
          url.includes("/sticker/") ||
          url.includes("/hoodie/") ||
          url.includes("/poster/") ||
          url.includes("/tank-top/") ||
          url.includes("/tote-bag/") ||
          url.includes("/phone-case/")) &&
        !url.includes("/user/")
      );
    }

    // Remove duplicates and clean up URLs
    productUrls = [...new Set(productUrls)];
    console.log(`Filtered to ${productUrls.length} product URLs`);

    // If no product URLs found, try extracting from HTML content
    if (productUrls.length === 0) {
      const html = scrapeData.data?.html || "";
      
      if (source === "redbubble") {
        // Extract product links from Redbubble HTML
        const regex = /href="(https:\/\/www\.redbubble\.com\/i\/[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      } else if (source === "teepublic") {
        // Extract product links from TeePublic HTML
        const regex = /href="(https:\/\/www\.teepublic\.com\/[^"]*(?:t-shirt|mug|sticker|hoodie|poster)\/[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      }
      
      productUrls = [...new Set(productUrls)];
      console.log(`Extracted ${productUrls.length} product URLs from HTML`);
    }

    // Limit to first 15 products for initial import
    const limitedUrls = productUrls.slice(0, 15);

    if (limitedUrls.length === 0) {
      console.log("No product URLs found, attempting crawl approach");
      
      // Try crawl as fallback
      const crawlResponse = await fetch("https://api.firecrawl.dev/v1/crawl", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: storeUrl,
          limit: 20,
          maxDepth: 2,
          scrapeOptions: {
            formats: ["markdown"],
            onlyMainContent: true,
          },
        }),
      });

      const crawlData = await crawlResponse.json();
      
      if (crawlData.success && crawlData.id) {
        // Return the crawl job ID for polling
        return new Response(
          JSON.stringify({
            success: true,
            message: `Crawl job started. Job ID: ${crawlData.id}. This may take a few minutes.`,
            crawlJobId: crawlData.id,
            designs: 0,
            status: "crawling"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const designs: any[] = [];

    // Scrape each product page
    for (const productUrl of limitedUrls) {
      try {
        console.log(`Scraping product: ${productUrl}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        const productResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const productData = await productResponse.json();

        if (productData.success && productData.data) {
          const metadata = productData.data.metadata || {};

          // Extract design info
          let name = metadata.title || "Untitled Design";

          // Clean up the title
          if (source === "redbubble") {
            name = name
              .replace(/ \| Redbubble$/i, "")
              .replace(/ by .+$/i, "")
              .replace(/ Essential T-Shirt$/i, "")
              .replace(/ Classic T-Shirt$/i, "")
              .replace(/ Sticker$/i, "")
              .trim();
          } else if (source === "teepublic") {
            name = name
              .replace(/ \| TeePublic$/i, "")
              .replace(/ T-Shirt$/i, "")
              .replace(/ Sticker$/i, "")
              .trim();
          }

          // Determine category from URL
          let category = "T-Shirts";
          if (productUrl.includes("/mug")) category = "Mugs";
          else if (productUrl.includes("/sticker")) category = "Stickers";
          else if (productUrl.includes("/hoodie")) category = "Hoodies";
          else if (productUrl.includes("/poster")) category = "Posters";
          else if (productUrl.includes("/phone-case")) category = "Phone Cases";
          else if (productUrl.includes("/tote-bag")) category = "Bags";

          // Get image URL from metadata
          const imageUrl =
            metadata.ogImage ||
            metadata.image ||
            `https://via.placeholder.com/600x600?text=${encodeURIComponent(name)}`;

          const design = {
            name: name.substring(0, 100),
            description: (metadata.description || "").substring(0, 500),
            image_url: imageUrl,
            category,
            tags: extractTags(name + " " + (metadata.description || "")),
            teepublic_url: source === "teepublic" ? productUrl : null,
            redbubble_url: source === "redbubble" ? productUrl : null,
            source,
            external_id: extractExternalId(productUrl, source),
            featured: false,
          };

          designs.push(design);
          console.log(`Extracted design: ${design.name}`);
        }
      } catch (err) {
        console.error(`Error scraping ${productUrl}:`, err);
      }
    }

    console.log(`Total designs extracted: ${designs.length}`);

    // Insert designs into database
    if (designs.length > 0) {
      const { data, error } = await supabase
        .from("designs")
        .upsert(designs, {
          onConflict: "external_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error("Database insert error:", error);
        return new Response(
          JSON.stringify({ success: false, error: `Database error: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Inserted ${data?.length || 0} designs into database`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${designs.length} designs from ${source}`,
        designs: designs.length,
        totalUrls: productUrls.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Import failed";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractTags(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const commonTags = [
    "geometric", "vintage", "retro", "minimalist", "abstract", "nature",
    "animal", "cat", "dog", "wolf", "space", "galaxy", "moon", "sun",
    "funny", "cute", "cool", "gaming", "music", "art", "design",
    "typography", "quote", "inspirational", "love", "heart", "flower",
    "skull", "skeleton", "halloween", "christmas", "summer", "beach",
    "sport", "coffee", "programmer", "developer", "code", "geek", "nerd"
  ];

  const foundTags = commonTags.filter(tag => words.some(word => word.includes(tag)));
  return foundTags.slice(0, 5);
}

function extractExternalId(url: string, source: string): string {
  if (source === "redbubble") {
    const match = url.match(/\/i\/(\d+)/);
    return match ? `rb_${match[1]}` : `rb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } else if (source === "teepublic") {
    const match = url.match(/\/(\d+)-/);
    return match ? `tp_${match[1]}` : `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `unknown_${Date.now()}`;
}
