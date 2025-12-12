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

    // First, map the site to get all product URLs
    const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: storeUrl,
        limit: 100,
      }),
    });

    const mapData = await mapResponse.json();
    
    if (!mapResponse.ok) {
      console.error("Firecrawl map error:", mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || "Failed to map store" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${mapData.links?.length || 0} URLs`);

    // Filter for product URLs based on the source
    let productUrls: string[] = [];
    
    if (source === "redbubble") {
      // Redbubble product URLs typically contain /i/amokan/ pattern
      productUrls = (mapData.links || []).filter((url: string) => 
        url.includes("/i/") && !url.includes("/shop") && !url.includes("/explore")
      );
    } else if (source === "teepublic") {
      // TeePublic product URLs contain /t-shirt/, /mug/, /sticker/, etc.
      productUrls = (mapData.links || []).filter((url: string) => 
        (url.includes("/t-shirt/") || url.includes("/mug/") || 
         url.includes("/sticker/") || url.includes("/hoodie/") ||
         url.includes("/poster/") || url.includes("/tank-top/") ||
         url.includes("/phone-case/")) && 
        !url.includes("/user/")
      );
    }

    console.log(`Filtered to ${productUrls.length} product URLs`);

    // Limit to first 20 products for initial import
    const limitedUrls = productUrls.slice(0, 20);
    
    const designs: any[] = [];
    
    // Scrape each product page
    for (const productUrl of limitedUrls) {
      try {
        console.log(`Scraping product: ${productUrl}`);
        
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ["markdown", "links"],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        
        if (scrapeData.success && scrapeData.data) {
          const metadata = scrapeData.data.metadata || {};
          const markdown = scrapeData.data.markdown || "";
          
          // Extract design info
          let name = metadata.title || "Untitled Design";
          
          // Clean up the title
          if (source === "redbubble") {
            name = name.replace(/ \| Redbubble$/i, "").replace(/ by .+$/i, "").trim();
          } else if (source === "teepublic") {
            name = name.replace(/ \| TeePublic$/i, "").replace(/ T-Shirt$/i, "").trim();
          }

          // Determine category from URL
          let category = "T-Shirts";
          if (productUrl.includes("/mug")) category = "Mugs";
          else if (productUrl.includes("/sticker")) category = "Stickers";
          else if (productUrl.includes("/hoodie")) category = "Hoodies";
          else if (productUrl.includes("/poster")) category = "Posters";
          else if (productUrl.includes("/phone-case")) category = "Phone Cases";

          // Get image URL from metadata
          const imageUrl = metadata.ogImage || metadata.image || 
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
          ignoreDuplicates: true 
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
        totalUrls: productUrls.length
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
    "skull", "skeleton", "halloween", "christmas", "summer", "beach"
  ];
  
  const foundTags = commonTags.filter(tag => words.some(word => word.includes(tag)));
  return foundTags.slice(0, 5);
}

function extractExternalId(url: string, source: string): string {
  if (source === "redbubble") {
    const match = url.match(/\/i\/(\d+)/);
    return match ? `rb_${match[1]}` : `rb_${Date.now()}`;
  } else if (source === "teepublic") {
    const match = url.match(/\/(\d+)-/);
    return match ? `tp_${match[1]}` : `tp_${Date.now()}`;
  }
  return `unknown_${Date.now()}`;
}
