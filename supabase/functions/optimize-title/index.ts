import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = ["https://extensionto.com", "https://aiprintverse.com"];

const getCorsHeaders = (origin: string | null) => {
  const corsOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

interface OptimizeTitleRequest {
  keyword: string;
  currentTitle: string;
  category?: string;
}

const systemPrompt = `You are an elite SEO copywriter specializing in high-CTR (Click-Through Rate) title optimization for English content targeting global audiences.

YOUR TASK: Generate 5 highly optimized, click-worthy SEO titles.

STRICT RULES:
1. **KEYWORD INTEGRITY**: The main keyword must remain 100% UNCHANGED. Place it at the BEGINNING or very early in the title for maximum SEO impact.

2. **CTR PSYCHOLOGY HOOKS** - Use at least ONE of these proven techniques per title:
   - Numbers (Top 10, 7 Best, 15 Creative...)
   - "How to" format
   - Year freshness (2026)
   - Curiosity gaps (What No One Tells You, The Secret to...)
   - Quick results (In 5 Minutes, Fast, Easy, Ultimate Guide)
   - Power words (Stunning, Proven, Essential, Must-Have)

3. **CHARACTER LIMIT**: Each title MUST be between 50-60 characters. This is CRITICAL for Google SERP display.

4. **TONE**: Professional, engaging, click-worthy. NEVER use:
   - ALL CAPS words
   - Clickbait that doesn't deliver
   - Spammy language

5. **UNIQUENESS**: Each of the 5 suggestions must use a DIFFERENT hook/approach.

OUTPUT FORMAT (JSON only):
{
  "titles": [
    {"title": "Title 1 here", "hook": "number", "charCount": 55},
    {"title": "Title 2 here", "hook": "how-to", "charCount": 58},
    {"title": "Title 3 here", "hook": "year", "charCount": 52},
    {"title": "Title 4 here", "hook": "curiosity", "charCount": 59},
    {"title": "Title 5 here", "hook": "power-word", "charCount": 56}
  ]
}`;

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, currentTitle, category }: OptimizeTitleRequest = await req.json();

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: "Keyword is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Generate 5 SEO-optimized, high-CTR titles for:

MAIN KEYWORD: "${keyword}"
CURRENT TITLE: "${currentTitle}"
${category ? `CATEGORY: ${category}` : ''}

Remember:
- The keyword "${keyword}" must appear UNCHANGED and preferably at the START
- Each title: 50-60 characters
- Use different hooks for variety
- Year 2026 for freshness
- Professional English, native-sounding

Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Parse the JSON from the response
    let parsedTitles;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedTitles = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify(parsedTitles),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Optimize title error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
