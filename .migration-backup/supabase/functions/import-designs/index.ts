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

    // Validate source
    const validSources = ["redbubble", "teepublic", "amazon", "etsy"];
    if (!validSources.includes(source)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid source. Must be one of: ${validSources.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured. Please add it in settings." }),
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
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("Firecrawl scrape error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || "Failed to scrape store. Please check the URL and try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allLinks = scrapeData.data?.links || [];
    const html = scrapeData.data?.html || "";
    console.log(`Found ${allLinks.length} total links on page`);

    let productUrls: string[] = [];

    // Extract product URLs based on source
    if (source === "redbubble") {
      productUrls = allLinks.filter((url: string) =>
        url.includes("redbubble.com") &&
        url.includes("/i/") &&
        !url.includes("/shop") &&
        !url.includes("/explore") &&
        !url.includes("/people/")
      );
      
      // Fallback: extract from HTML
      if (productUrls.length === 0) {
        const regex = /href="(https:\/\/www\.redbubble\.com\/i\/[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      }
    } else if (source === "teepublic") {
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
      
      // Fallback: extract from HTML
      if (productUrls.length === 0) {
        const regex = /href="(https:\/\/www\.teepublic\.com\/[^"]*(?:t-shirt|mug|sticker|hoodie|poster)\/[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      }
    } else if (source === "amazon") {
      // Amazon Merch product URLs
      productUrls = allLinks.filter((url: string) =>
        (url.includes("amazon.com/dp/") || url.includes("amazon.com/gp/product/")) &&
        !url.includes("/ref=")
      );
      
      // Fallback: extract from HTML
      if (productUrls.length === 0) {
        const regex = /href="(https:\/\/www\.amazon\.com\/(?:dp|gp\/product)\/[A-Z0-9]+)"/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      }
    } else if (source === "etsy") {
      // Etsy product URLs
      productUrls = allLinks.filter((url: string) =>
        url.includes("etsy.com/listing/") &&
        !url.includes("/similar") &&
        !url.includes("/reviews")
      );
      
      // Fallback: extract from HTML
      if (productUrls.length === 0) {
        const regex = /href="(https:\/\/www\.etsy\.com\/listing\/\d+[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          productUrls.push(match[1]);
        }
      }
    }

    // Remove duplicates and clean up URLs
    productUrls = [...new Set(productUrls)].map(url => {
      // Clean up URL by removing query params if needed
      try {
        const urlObj = new URL(url);
        // Keep important params, remove tracking ones
        urlObj.searchParams.delete("ref");
        urlObj.searchParams.delete("ref_");
        return urlObj.toString();
      } catch {
        return url;
      }
    });
    
    console.log(`Filtered to ${productUrls.length} product URLs`);

    // Limit products
    const limitedUrls = productUrls.slice(0, 25);

    if (limitedUrls.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No product URLs found on this page. Please check that the store URL is correct and contains products.",
          debug: {
            totalLinks: allLinks.length,
            htmlLength: html.length
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const designs: any[] = [];

    // Scrape each product page
    for (const productUrl of limitedUrls) {
      try {
        console.log(`Scraping product: ${productUrl}`);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));

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
            waitFor: 3000,
          }),
        });

        const productData = await productResponse.json();

        if (productData.success && productData.data) {
          const metadata = productData.data.metadata || {};

          // Extract design info
          let name = metadata.title || "Untitled Design";

          // Clean up the title based on source
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
          } else if (source === "amazon") {
            name = name
              .replace(/ - Amazon\.com$/i, "")
              .replace(/Amazon\.com: /i, "")
              .trim();
          } else if (source === "etsy") {
            name = name
              .replace(/ - Etsy$/i, "")
              .replace(/ \| Etsy$/i, "")
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

          const design: any = {
            name: name.substring(0, 100),
            description: (metadata.description || "").substring(0, 500),
            image_url: imageUrl,
            category,
            tags: extractTags(name + " " + (metadata.description || "")),
            source,
            external_id: extractExternalId(productUrl, source),
            featured: false,
          };

          // Set the correct URL field based on source
          if (source === "teepublic") {
            design.teepublic_url = productUrl;
          } else if (source === "redbubble") {
            design.redbubble_url = productUrl;
          } else if (source === "amazon") {
            design.amazon_url = productUrl;
          } else if (source === "etsy") {
            design.etsy_url = productUrl;
          }

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
  } else if (source === "amazon") {
    const match = url.match(/\/(?:dp|product)\/([A-Z0-9]+)/i);
    return match ? `amz_${match[1]}` : `amz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  } else if (source === "etsy") {
    const match = url.match(/\/listing\/(\d+)/);
    return match ? `etsy_${match[1]}` : `etsy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return `unknown_${Date.now()}`;
}
