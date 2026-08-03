import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAndDisambiguateSlug } from "../_shared/duplicate-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bluesminds OpenAI-compatible endpoints to try in order.
const BASE_URLS = [
  "https://api.bluesminds.com/v1",
  "https://api.bluesminds.com/console/v1",
];

// Candidate models known to work through the aggregator. We iterate until one succeeds.
const CANDIDATE_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "claude-3-5-sonnet",
  "claude-sonnet-4",
  "gemini-2.5-flash",
  "deepseek-chat",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      keyword,
      category = "General",
      language = "en",
      includeImages = true,
      includeFAQ = true,
      includeTOC = true,
      includeComparisonTable = false,
      writingStyle = "professional",
      model: preferredModel,
      competitorBrief,
      revisionFeedback,
    } = body;

    // Prefer the "Api1" secret the user configured; fall back to standard env names.
    const apiKey =
      Deno.env.get("Api1") ||
      Deno.env.get("BLUESMINDS_API_KEY") ||
      body.apiKey;

    if (!keyword) {
      return json({ error: "Keyword is required" }, 400);
    }
    if (!apiKey) {
      return json({ error: "Bluesminds API key missing. Add it as secret 'Api1'." }, 200);
    }

    const systemPrompt = buildSystemPrompt(language, writingStyle, includeComparisonTable);
    const userPrompt = buildUserPrompt(keyword, category, includeImages, includeFAQ, includeTOC, includeComparisonTable, competitorBrief, revisionFeedback);

    const models = preferredModel ? [preferredModel, ...CANDIDATE_MODELS] : CANDIDATE_MODELS;

    let lastError = "";
    for (const base of BASE_URLS) {
      for (const model of models) {
        try {
          const resp = await fetch(`${base}/chat/completions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_tokens: 8000,
              temperature: 0.8,
            }),
          });
          if (!resp.ok) {
            lastError = `${base} [${model}] ${resp.status}: ${(await resp.text()).slice(0, 200)}`;
            continue;
          }
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            lastError = `${base} [${model}] returned empty content`;
            continue;
          }
          return json(await parseArticleContent(content, keyword, category, model));
        } catch (e) {
          lastError = `${base} [${model}] ${(e as Error).message}`;
        }
      }
    }

    return json({ error: `All Bluesminds attempts failed. Last: ${lastError}` }, 200);
  } catch (error) {
    console.error("bluesminds error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(language: string, style: string, includeComparisonTable: boolean): string {
  const langName = language === "ar" ? "Arabic" : language === "fr" ? "French" : language === "es" ? "Spanish" : language === "de" ? "German" : "English";
  return `You are a senior SEO editor and topical expert. Write like a real human expert — NOT like AI.
Language: ${langName}. Tone: ${style}. Output HTML only (no markdown, no code fences).
Rules:
- 2000-3000 words, deep, specific, non-generic.
- Vary sentence length, use rhetorical questions, real examples, concrete numbers.
- Avoid AI tells: no "in today's fast-paced world", no "delve", no "in conclusion".
- Include 3-5 credible EXTERNAL links to authoritative domains (Wikipedia, .gov, .edu, major publications) using <a href="..." target="_blank" rel="noopener nofollow">anchor</a>.
- Include 2-4 INTERNAL link placeholders as <a href="/blog/RELATED-SLUG" data-internal="true">natural anchor</a> — the system will resolve them.
- Structure: <article><h1>Title</h1><div class="toc"><h2>Table of Contents</h2><ul>...</ul></div><div class="key-takeaways"><h2>Key Takeaways</h2><ul>...</ul></div> then sections with H2/H3, then <section class="faq" itemscope itemtype="https://schema.org/FAQPage">...</section></article>.
${includeComparisonTable ? "- Include one detailed HTML comparison <table>." : ""}
- Use Schema.org FAQPage markup on the FAQ section.
- Include descriptive image placeholders <img src="[IMAGE]" alt="..."> if images requested.`;
}

function buildUserPrompt(keyword: string, category: string, images: boolean, faq: boolean, toc: boolean, table: boolean, competitorBrief?: string, revisionFeedback?: string) {
  return `Write a comprehensive SEO article that ranks in the top 3 for: "${keyword}"
Category: ${category}
Include images: ${images}
Include FAQ (Schema.org): ${faq}
Include Table of Contents: ${toc}
Include comparison table: ${table}
${competitorBrief ? `\nCOMPETITIVE INTELLIGENCE — the top-ranking pages for this keyword were analyzed. To outrank them, this article MUST:\n${competitorBrief}\n` : ""}
${revisionFeedback ? `\nREVISION REQUIRED — a quality check on a previous draft found these specific problems, fix them in this version:\n${revisionFeedback}\n` : ""}
Write with genuine authority, personal-sounding voice, and unique angles competitors miss.`;
}

async function parseArticleContent(content: string, keyword: string, category: string, model: string) {
  const clean = content.replace(/^```html\s*/i, "").replace(/```\s*$/i, "");
  const titleMatch = clean.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : keyword;
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100);
  const excerptMatch = clean.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]*>/g, "").trim().slice(0, 300) : `Comprehensive guide about ${keyword}`;
  const metaDescription = excerpt.slice(0, 155) + (excerpt.length > 155 ? "..." : "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const { slug, duplicateWarning } = supabaseUrl && supabaseKey
    ? await checkAndDisambiguateSlug(supabaseUrl, supabaseKey, title, baseSlug)
    : { slug: baseSlug, duplicateWarning: null };

  return {
    title,
    slug,
    content: clean,
    excerpt,
    meta_title: title.slice(0, 60),
    meta_description: metaDescription,
    category,
    duplicateWarning,
    _model: model,
  };
}
