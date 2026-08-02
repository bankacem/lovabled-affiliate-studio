import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function does what the old "serp-analysis" function couldn't: it
// performs a REAL web search (not an LLM guessing what might rank), fetches
// the actual top-ranking pages, and asks the LLM to identify concrete gaps
// and weaknesses in them — missing sections, thin coverage, no comparison
// table, no FAQ, outdated info, etc. The result is a short, concrete
// "competitorBrief" string that the article generators (generate-article,
// generate-article-openrouter, generate-article-groq,
// generate-article-bluesminds) accept and weave directly into their prompt,
// so the generated article is specifically written to cover what the
// competitors miss.
//
// Requires a SERPER_API_KEY secret (https://serper.dev — has a one-time free
// trial credit, then ~$0.001/search, negligible for occasional use). Without
// it, this function returns a clear error rather than silently failing or
// guessing, since a fabricated "competitor analysis" would be actively
// misleading.

interface CompetitorPage {
  url: string;
  title: string;
  snippet: string;
  extractedText: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();
    if (!keyword) {
      return json({ error: "Keyword is required" }, 400);
    }

    const serperKey = Deno.env.get("SERPER_API_KEY");
    if (!serperKey) {
      return json(
        {
          error:
            "SERPER_API_KEY is not configured. Sign up at serper.dev, add the key as a secret named SERPER_API_KEY, then retry. Without a real search API this feature cannot honestly analyze actual competitors.",
        },
        200,
      );
    }

    // 1) Real Google search via Serper.dev
    const searchResp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: keyword, num: 5 }),
    });

    if (!searchResp.ok) {
      const errText = await searchResp.text();
      return json({ error: `Search failed: ${searchResp.status} - ${errText}` }, 200);
    }

    const searchData = await searchResp.json();
    const organic = (searchData.organic || []).slice(0, 3) as Array<{
      link: string;
      title: string;
      snippet?: string;
    }>;

    if (organic.length === 0) {
      return json({ error: "No organic search results found for this keyword." }, 200);
    }

    // 2) Fetch and lightly extract text from each of the top 3 pages
    const pages: CompetitorPage[] = [];
    for (const result of organic) {
      try {
        const pageResp = await fetch(result.link, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AIPrintVerseBot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await pageResp.text();
        pages.push({
          url: result.link,
          title: result.title,
          snippet: result.snippet || "",
          extractedText: extractReadableText(html).slice(0, 4000),
        });
      } catch (e) {
        // A competitor page failing to fetch shouldn't kill the whole
        // analysis — just note it and continue with what we have.
        pages.push({
          url: result.link,
          title: result.title,
          snippet: result.snippet || "",
          extractedText: `[Could not fetch page content: ${(e as Error).message}]`,
        });
      }
    }

    // 3) Ask an LLM to turn the raw competitor content into concrete,
    // actionable gaps — using whichever key is already configured, same
    // fallback order as the article generators.
    const brief = await synthesizeBrief(keyword, pages);

    return json({
      keyword,
      competitors: pages.map((p) => ({ url: p.url, title: p.title })),
      competitorBrief: brief,
    });
  } catch (error) {
    console.error("analyze-competitors error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function extractReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function synthesizeBrief(keyword: string, pages: CompetitorPage[]): Promise<string> {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  const analysisPrompt = `You are a senior SEO strategist. Here are the top 3 Google results for the keyword "${keyword}":

${pages
  .map(
    (p, i) => `--- Competitor ${i + 1}: ${p.url} ---
Title: ${p.title}
Content excerpt: ${p.extractedText}
`,
  )
  .join("\n")}

Analyze these 3 competitors and identify their CONCRETE weaknesses and gaps: missing subtopics, outdated info, no comparison tables, no FAQ, thin sections, no real examples/data, generic advice, poor structure, etc.

Respond with ONLY a short bulleted list (5-8 bullets max) of specific, actionable instructions for how a new article should exploit these exact gaps to be genuinely more useful than all 3. Be concrete — reference what's actually missing, not generic SEO advice. No preamble, no conclusion, just the bullet list.`;

  try {
    if (openrouterKey) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${openrouterKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: 800,
          temperature: 0.4,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    }
    if (groqKey) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: 800,
          temperature: 0.4,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    }
    if (lovableKey) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    }
  } catch (e) {
    console.error("synthesizeBrief error:", e);
  }

  // Fallback: no LLM key available to synthesize a brief — return the raw
  // titles/snippets so the admin still gets something useful rather than
  // an opaque failure.
  return `(No AI key configured to synthesize gaps — raw competitor titles for manual review)\n${pages
    .map((p) => `- ${p.title} (${p.url})`)
    .join("\n")}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
