import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) {
      return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query parameter" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search for t-shirt / print-on-demand related images
    const searchQuery = `${query} t-shirt print design`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;

    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Unsplash API error:", response.status, errText);
      return new Response(JSON.stringify({ error: `Unsplash API error: ${response.status}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      // Fallback: try broader search
      const fallbackUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      });
      const fallbackData = await fallbackRes.json();

      if (!fallbackData.results || fallbackData.results.length === 0) {
        return new Response(JSON.stringify({ error: "No images found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const photo = fallbackData.results[0];
      // WebP format via Unsplash CDN params
      const imageUrl = `${photo.urls.raw}&w=1200&h=630&fit=crop&fm=webp&q=80`;
      return new Response(JSON.stringify({ imageUrl, source: "unsplash", photographer: photo.user.name }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photo = data.results[0];
    const imageUrl = `${photo.urls.raw}&w=1200&h=630&fit=crop&fm=webp&q=80`;

    return new Response(JSON.stringify({ imageUrl, source: "unsplash", photographer: photo.user.name }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
