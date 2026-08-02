import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAndDisambiguateSlug } from "../_shared/duplicate-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, category, language, includeImages, includeFAQ, includeTOC, includeComparisonTable, writingStyle, apiKey, model, competitorBrief } = await req.json();

    if (!keyword) {
      return new Response(JSON.stringify({ error: "Keyword is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenRouter API key is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = buildSystemPrompt(language || 'en', writingStyle || 'professional', includeComparisonTable);
    const userPrompt = `Write a comprehensive SEO-optimized article about: "${keyword}"
${category ? `Category: ${category}` : ''}
${includeImages ? 'Include image placeholders with descriptive alt text' : 'No images needed'}
${includeFAQ ? 'Include FAQ section with Schema.org markup' : 'Skip FAQ section'}
${includeTOC ? 'Include Table of Contents' : 'Skip Table of Contents'}
${includeComparisonTable ? 'Include a detailed comparison table' : ''}
${competitorBrief ? `\nCOMPETITIVE INTELLIGENCE — the top-ranking pages for this keyword were analyzed. To outrank them, this article MUST:\n${competitorBrief}\n` : ''}
IMPORTANT: Write this as a real human expert would. Be natural, engaging, and provide genuine value.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aiprintverse.com",
        "X-Title": "AI Blog Generator",
      },
      body: JSON.stringify({
        model: model || "anthropic/claude-sonnet-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `OpenRouter error: ${response.status} - ${errorText}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    const result = await parseArticleContent(content, keyword, category || "General");
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function parseArticleContent(content: string, keyword: string, category: string) {
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : keyword;
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100);
  const excerptMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
  const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]*>/g, '').slice(0, 300) : `Comprehensive guide about ${keyword}`;
  const metaDescription = excerpt.slice(0, 155) + (excerpt.length > 155 ? '...' : '');

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const { slug, duplicateWarning } = supabaseUrl && supabaseKey
    ? await checkAndDisambiguateSlug(supabaseUrl, supabaseKey, title, baseSlug)
    : { slug: baseSlug, duplicateWarning: null };

  return {
    title,
    slug,
    content,
    excerpt,
    meta_title: title.slice(0, 60),
    meta_description: metaDescription,
    category,
    duplicateWarning,
  };
}

function buildSystemPrompt(language: string, style: string, includeComparisonTable: boolean): string {
  const langName = language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : language === 'es' ? 'Spanish' : language === 'de' ? 'German' : 'English';
  
  return `You are a professional SEO content writer who writes like a REAL HUMAN.
Write in ${langName}. Use proper HTML structure with semantic tags.
Include a Table of Contents, H2/H3 headings, FAQ section with Schema.org markup.
${includeComparisonTable ? 'Include a comparison table with proper HTML table structure.' : ''}
Write naturally - avoid AI patterns. Use varied sentence lengths, rhetorical questions, and real examples.
Output HTML only (no markdown). Make content 2000-3000 words.
Use this structure: <article><h1>Title</h1><div class="toc">...</div><div class="summary">Key Takeaways</div><section>...</section>...<section class="faq" itemscope itemtype="https://schema.org/FAQPage">...</section></article>`;
}
