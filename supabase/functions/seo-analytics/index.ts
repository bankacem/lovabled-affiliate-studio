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
    const { articles } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return new Response(JSON.stringify({ error: "Articles array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articlesSummary = articles.map((a: any) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      views: a.view_count || 0,
      clicks: a.clicks || 0,
      impressions: a.impressions || 0,
      ctr: a.impressions > 0 ? ((a.clicks || 0) / a.impressions * 100).toFixed(2) + "%" : "N/A",
      keywords: a.keywords || [],
      published_at: a.published_at,
    }));

    const prompt = `You are an SEO analytics engine for a Print-on-Demand blog (aiprintverse.com).

Analyze these ${articlesSummary.length} articles and provide actionable insights.

ARTICLES DATA:
${JSON.stringify(articlesSummary, null, 2)}

STEP 1 - Classify articles:
- "winners": Top performers (high views/clicks/CTR relative to others)
- "losers": Underperformers that need attention

STEP 2 - For each loser, suggest:
- Update strategy (what to improve)
- Internal linking improvements
- Content expansion ideas

STEP 3 - Prioritize actions:
- quick_wins: Easy fixes with high impact
- high_roi: Bigger efforts with significant returns

Return JSON:
{
  "winners": [{ "id": "", "title": "", "reason": "", "views": 0, "clicks": 0, "ctr": "" }],
  "losers": [{ "id": "", "title": "", "reason": "", "views": 0, "clicks": 0, "ctr": "", "suggestions": { "update_strategy": "", "internal_linking": "", "content_expansion": "" } }],
  "actions": {
    "quick_wins": [{ "article_id": "", "action": "", "expected_impact": "" }],
    "high_roi": [{ "article_id": "", "action": "", "expected_impact": "" }]
  },
  "overall_insights": ""
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
          { role: "system", content: "You are an expert SEO analyst for Print-on-Demand businesses. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
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
