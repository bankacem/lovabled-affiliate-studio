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
    const { currentArticle, existingArticles } = await req.json();

    if (!currentArticle || !existingArticles) {
      return new Response(JSON.stringify({ error: "currentArticle and existingArticles are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articlesList = existingArticles.map((a: any) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      excerpt: a.excerpt?.slice(0, 100),
    }));

    const prompt = `You are an internal linking AI for aiprintverse.com (Print-on-Demand niche).

CURRENT ARTICLE:
Title: "${currentArticle.title}"
Category: ${currentArticle.category}
Slug: ${currentArticle.slug}

EXISTING ARTICLES (${articlesList.length} total):
${JSON.stringify(articlesList, null, 2)}

STEP 1: Find closely related articles, supporting topics, and commercial pages.

STEP 2: Select exactly:
- 2 informational links (educational/guide articles)
- 2 commercial links (product/design related articles)

STEP 3: Generate natural anchor text and contextual placement suggestions.

RULES:
- Links must feel natural in context
- No forced or spammy linking
- Improve topical relevance and SEO authority
- Use the slug to build the URL as /blog/{slug}

Return JSON:
{
  "internal_links": [
    {
      "target_article_id": "",
      "target_title": "",
      "url": "/blog/slug-here",
      "anchor_text": "",
      "placement": "Description of where in the article to place this link",
      "link_type": "informational" | "commercial",
      "relevance_score": 0.0-1.0
    }
  ],
  "linking_strategy": "Brief explanation of the linking strategy"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert SEO internal linking specialist. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
