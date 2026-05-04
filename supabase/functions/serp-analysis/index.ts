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
    const { keyword, language } = await req.json();

    if (!keyword) {
      return new Response(JSON.stringify({ error: "Keyword is required" }), {
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

    const langName = language === "ar" ? "Arabic" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "de" ? "German" : "English";

    const systemPrompt = `You are a SERP domination engine and SEO expert specializing in Print-on-Demand (POD) and custom merchandise niches. Your analysis must be thorough, actionable, and data-driven. Always respond in ${langName}. Return valid JSON only.`;

    const userPrompt = `Analyze the keyword: "${keyword}"

STEP 1: Simulate the top 3 Google results for this keyword. For each result provide:
- title: the likely page title
- estimated_word_count: realistic word count
- main_headings: array of H2/H3 headings they likely use
- strengths: array of what they do well
- weaknesses: array of what they miss or do poorly

STEP 2: Identify content gaps across all competitors:
- missing_sections: topics none of them cover well
- weak_explanations: areas with shallow coverage
- lack_of_examples: where real examples are missing
- poor_structure: structural issues

STEP 3: Create a SUPERIOR article outline that beats all competitors:
- suggested_title: SEO-optimized title (under 60 chars)
- suggested_meta_description: compelling meta description (under 155 chars)
- estimated_word_count: target word count
- outline: array of sections, each with { heading, subheadings: [], key_points: [], content_type: "text|list|table|comparison|faq" }

STEP 4: Define the "Unfair Advantage" - what makes this content impossible to beat:
- unique_angle: a fresh perspective no competitor uses
- strong_opinions: bold takes that build authority
- real_life_insights: practical POD/merchandise insights
- call_to_action: how to convert readers

Return as JSON with this exact structure:
{
  "competitor_analysis": [...],
  "content_gaps": { "missing_sections": [], "weak_explanations": [], "lack_of_examples": [], "poor_structure": [] },
  "superior_outline": { "suggested_title": "", "suggested_meta_description": "", "estimated_word_count": 0, "outline": [] },
  "unfair_advantage": { "unique_angle": "", "strong_opinions": [], "real_life_insights": [], "call_to_action": "" }
}`;

    const response = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `AI error: ${response.status} - ${errorText}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
