import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkAndDisambiguateSlug } from "../_shared/duplicate-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WritingStyle = "professional" | "friendly" | "conversational" | "academic" | "persuasive" | "storytelling";

interface ArticleRequest {
  keyword: string;
  category?: string;
  language?: string;
  includeImages?: boolean;
  includeFAQ?: boolean;
  includeTOC?: boolean;
  includeComparisonTable?: boolean;
  writingStyle?: WritingStyle;
  competitorBrief?: string;
  revisionFeedback?: string;
}

const getStyleInstructions = (style: WritingStyle): string => {
  const styles: Record<WritingStyle, string> = {
    professional: `
WRITING STYLE - PROFESSIONAL:
- Use formal, authoritative language
- Include industry-specific terminology with explanations
- Cite data and statistics when making claims
- Maintain objective, balanced perspective
- Use third-person point of view
- Focus on accuracy and credibility`,
    
    friendly: `
WRITING STYLE - FRIENDLY:
- Use warm, approachable language
- Write as if talking to a friend
- Include personal anecdotes and relatable examples
- Use contractions naturally (you're, we're, it's)
- Add encouraging phrases and positive tone
- Keep technical jargon minimal`,
    
    conversational: `
WRITING STYLE - CONVERSATIONAL:
- Write like you're having a coffee chat with the reader
- Use "you" and "I" frequently
- Ask rhetorical questions to engage readers
- Include casual expressions and idioms
- Break complex topics into simple explanations
- Use short sentences and paragraphs`,
    
    academic: `
WRITING STYLE - ACADEMIC:
- Use scholarly, research-based language
- Include proper citations format (Author, Year)
- Present multiple perspectives on topics
- Use precise, technical vocabulary
- Maintain formal structure with clear methodology
- Include literature references and theoretical frameworks`,
    
    persuasive: `
WRITING STYLE - PERSUASIVE:
- Use compelling, action-oriented language
- Include strong calls-to-action throughout
- Present benefits clearly and convincingly
- Address and overcome common objections
- Use emotional appeals alongside logic
- Create urgency and excitement`,
    
    storytelling: `
WRITING STYLE - STORYTELLING:
- Open with a captivating hook or scenario
- Use narrative structure (beginning, middle, end)
- Include characters, settings, and plots when applicable
- Create emotional connections through stories
- Use vivid descriptions and sensory language
- Weave information into engaging narratives`,
  };
  
  return styles[style] || styles.professional;
};

const generateSystemPrompt = (language: string, style: WritingStyle, includeComparisonTable: boolean) => {
  const styleInstructions = getStyleInstructions(style);
  const langName = language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : language === 'es' ? 'Spanish' : language === 'de' ? 'German' : 'English';
  
  const comparisonTableSection = includeComparisonTable ? `
11. Include a detailed COMPARISON TABLE section with proper HTML table structure
    - Use <table class="comparison-table"> with proper thead and tbody
    - Compare at least 4-5 items/options related to the topic
    - Include columns for: Feature/Item, Pros, Cons, Rating, Price/Cost (if applicable)
    - Style cells with appropriate classes for pros (text-green-600) and cons (text-red-600)` : '';

  return `You are a professional SEO content writer who writes like a REAL HUMAN, not an AI.

${styleInstructions}

CRITICAL REQUIREMENTS:
1. Write in ${langName}
2. Use proper HTML structure with semantic tags
3. Include a Table of Contents at the beginning
4. Use H2 and H3 headings properly
5. Include relevant internal linking placeholders
6. Add an FAQ section at the end with 5-7 questions
7. WRITE NATURALLY LIKE A HUMAN - avoid AI patterns like "In this article" or "Let me explain"
8. Include relevant statistics and facts with natural integration
9. Use bullet points and numbered lists where appropriate
10. Add relevant images placeholders with descriptive alt text
${comparisonTableSection}

HUMAN WRITING PATTERNS TO USE:
- Start paragraphs in varied ways, not always with the subject
- Use transitional phrases naturally: "Here's the thing...", "What's interesting is...", "You might be wondering..."
- Include personal opinions where appropriate: "In my experience...", "What I've found is..."
- Vary sentence length - mix short punchy sentences with longer ones
- Use rhetorical questions to engage readers
- Include real examples and case studies
- Avoid overused AI phrases like "In conclusion", "Furthermore", "It is important to note"
- Add humor or wit where appropriate for the topic
- Show personality through word choice

OUTPUT FORMAT (HTML only, no markdown):
<article>
  <h1>[Title - Make it catchy and click-worthy]</h1>
  
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
  
  ${includeComparisonTable ? `
  <section id="comparison" class="comparison-section">
    <h2>Comparison Table</h2>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Feature/Option</th>
          <th>Pros</th>
          <th>Cons</th>
          <th>Rating</th>
          <th>Best For</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Option 1</td>
          <td class="text-green-600">Pro points...</td>
          <td class="text-red-600">Con points...</td>
          <td>⭐⭐⭐⭐⭐</td>
          <td>Use case...</td>
        </tr>
        ...
      </tbody>
    </table>
  </section>
  ` : ''}
  
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

Make the content comprehensive (2000-3000 words), engaging, and valuable to readers. Write like a human expert, not an AI.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      keyword, 
      category, 
      language = 'en', 
      includeImages = true, 
      includeFAQ = true, 
      includeTOC = true,
      includeComparisonTable = false,
      writingStyle = 'professional',
      competitorBrief,
      revisionFeedback
    }: ArticleRequest = await req.json();

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
${includeComparisonTable ? 'Include a detailed comparison table comparing relevant options/products/methods' : ''}
${competitorBrief ? `\nCOMPETITIVE INTELLIGENCE — the top-ranking pages for this keyword were analyzed. To outrank them, this article MUST:\n${competitorBrief}\n` : ''}
${revisionFeedback ? `\nREVISION REQUIRED — a quality check on a previous draft found these specific problems, fix them in this version:\n${revisionFeedback}\n` : ''}

IMPORTANT: Write this as a real human expert would. Avoid AI-sounding phrases. Be natural, engaging, and provide genuine value to readers. Show personality and expertise.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: generateSystemPrompt(language, writingStyle as WritingStyle, includeComparisonTable) },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Slightly higher for more natural variation
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
    const baseSlug = title
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const { slug, duplicateWarning } = supabaseUrl && supabaseKey
      ? await checkAndDisambiguateSlug(supabaseUrl, supabaseKey, title, baseSlug)
      : { slug: baseSlug, duplicateWarning: null };

    return new Response(
      JSON.stringify({
        title,
        slug,
        content,
        excerpt,
        meta_title: title.slice(0, 60),
        meta_description: metaDescription,
        category: category || "General",
        writingStyle,
        duplicateWarning,
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
