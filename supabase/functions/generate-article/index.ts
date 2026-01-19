import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArticleRequest {
  keyword: string;
  category?: string;
  language?: string;
  includeImages?: boolean;
  includeFAQ?: boolean;
  includeTOC?: boolean;
}

const generateSystemPrompt = (language: string) => `You are a professional SEO content writer. Write high-quality, engaging, and SEO-optimized articles.

CRITICAL REQUIREMENTS:
1. Write in ${language === 'ar' ? 'Arabic' : 'English'}
2. Use proper HTML structure with semantic tags
3. Include a Table of Contents at the beginning
4. Use H2 and H3 headings properly
5. Include relevant internal linking placeholders
6. Add an FAQ section at the end with 5-7 questions
7. Write naturally like a human expert
8. Include relevant statistics and facts
9. Use bullet points and numbered lists where appropriate
10. Add relevant images placeholders with descriptive alt text

OUTPUT FORMAT (HTML only, no markdown):
<article>
  <h1>[Title]</h1>
  
  <div class="toc">
    <h3>Table of Contents</h3>
    <ul>
      <li><a href="#section1">Section 1</a></li>
      ...
    </ul>
  </div>
  
  <div class="summary">
    <h3>Key Takeaways</h3>
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
      ...
    </ul>
  </div>
  
  <section id="section1">
    <h2>Heading</h2>
    <p>Content...</p>
    <img src="[IMAGE_PLACEHOLDER]" alt="descriptive alt text">
  </section>
  
  ... more sections ...
  
  <section class="faq" itemscope itemtype="https://schema.org/FAQPage">
    <h2>Frequently Asked Questions</h2>
    <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 itemprop="name">Question?</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">Answer...</p>
      </div>
    </div>
  </section>
</article>

Make the content comprehensive (2000-3000 words), engaging, and valuable to readers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, category, language = 'en', includeImages = true, includeFAQ = true, includeTOC = true }: ArticleRequest = await req.json();

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

    const userPrompt = `Write a comprehensive SEO-optimized article about: "${keyword}"
${category ? `Category: ${category}` : ''}
${includeImages ? 'Include image placeholders with descriptive alt text' : 'No images needed'}
${includeFAQ ? 'Include FAQ section with Schema.org markup' : 'Skip FAQ section'}
${includeTOC ? 'Include Table of Contents' : 'Skip Table of Contents'}

Focus on providing valuable, actionable information that helps readers understand this topic deeply.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: generateSystemPrompt(language) },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
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

    // Extract title from content
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : keyword;

    // Generate slug
    const slug = "p-" + title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);

    // Generate excerpt
    const excerptMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
    const excerpt = excerptMatch 
      ? excerptMatch[1].replace(/<[^>]*>/g, '').slice(0, 300) 
      : `Comprehensive guide about ${keyword}`;

    // Generate meta description
    const metaDescription = excerpt.slice(0, 155) + (excerpt.length > 155 ? '...' : '');

    return new Response(
      JSON.stringify({
        title,
        slug,
        content,
        excerpt,
        meta_title: title.slice(0, 60),
        meta_description: metaDescription,
        category: category || "General",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate article error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
