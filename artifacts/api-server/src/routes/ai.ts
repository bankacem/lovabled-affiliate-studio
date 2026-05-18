import { Router } from "express";
import { db, blogPostsTable, autoLinkKeywordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function getEnv(key: string) {
  return process.env[key] || "";
}

// Parse article content from AI response
function parseArticleContent(content: string, keyword: string, category: string) {
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "") : keyword;
  const slug = "p-" + title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100);
  const excerptMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
  const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]*>/g, "").slice(0, 300) : `Comprehensive guide about ${keyword}`;
  const metaDescription = excerpt.slice(0, 155) + (excerpt.length > 155 ? "..." : "");
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readTime = `${Math.ceil(wordCount / 200)} min read`;
  return { title, slug, content, excerpt, meta_title: title, meta_description: metaDescription, tags: [keyword, category], read_time: readTime };
}

router.post("/ai/generate-article", async (req, res) => {
  const { keyword, category = "General", language = "en", includeImages, includeFAQ, includeTOC, writingStyle = "professional", provider = "openrouter" } = req.body;

  const openaiKey = getEnv("OPENAI_API_KEY");
  const openrouterKey = getEnv("OPENROUTER_API_KEY");
  const groqKey = getEnv("GROQ_API_KEY");

  const systemPrompt = `You are an expert SEO content writer. Write comprehensive, well-structured articles in ${language === "ar" ? "Arabic" : language === "en" ? "English" : language}. ${language === "ar" ? "Use proper Arabic typography and RTL formatting." : ""} Use HTML formatting for headings (h2, h3), paragraphs, lists, and blockquotes. Make the content engaging, informative, and optimized for search engines.`;

  const userPrompt = `Write a comprehensive SEO-optimized article about: "${keyword}"
Category: ${category}
${includeImages ? "Include image placeholders: <img src='[IMAGE]' alt='descriptive alt text' />" : ""}
${includeFAQ ? "Include a FAQ section with common questions and answers." : ""}
${includeTOC ? "Include a Table of Contents at the start." : ""}
Start with an H1 title, then provide at least 1500 words of valuable content.`;

  try {
    let result = null;

    if (provider === "openrouter" && openrouterKey) {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openrouterKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://aiprintverse.com", "X-Title": "AIPrintVerse Blog" },
        body: JSON.stringify({ model: "anthropic/claude-sonnet-4", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: 8000, temperature: 0.8 }),
      });
      const data = await resp.json() as any;
      if (data.choices?.[0]?.message?.content) result = parseArticleContent(data.choices[0].message.content, keyword, category);
    } else if (provider === "groq" && groqKey) {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: 8000 }),
      });
      const data = await resp.json() as any;
      if (data.choices?.[0]?.message?.content) result = parseArticleContent(data.choices[0].message.content, keyword, category);
    } else if (openaiKey) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: 8000 }),
      });
      const data = await resp.json() as any;
      if (data.choices?.[0]?.message?.content) result = parseArticleContent(data.choices[0].message.content, keyword, category);
    }

    if (!result) {
      res.status(503).json({ error: "No AI provider configured. Please set OPENROUTER_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY." });
      return;
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "AI generate-article failed");
    res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/optimize-title", async (req, res) => {
  const { title, keyword, context } = req.body;
  const openrouterKey = getEnv("OPENROUTER_API_KEY");
  const openaiKey = getEnv("OPENAI_API_KEY");

  const prompt = `Generate 5 SEO-optimized title variations for this article title: "${title}". Keyword to target: "${keyword || title}". Context: ${context || "blog article"}. Return as JSON array of strings. Only return the JSON array, no other text.`;

  try {
    let suggestions: string[] = [];

    if (openrouterKey) {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openrouterKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://aiprintverse.com" },
        body: JSON.stringify({ model: "anthropic/claude-haiku-4", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
      });
      const data = await resp.json() as any;
      const content = data.choices?.[0]?.message?.content || "[]";
      suggestions = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || "[]");
    } else if (openaiKey) {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
      });
      const data = await resp.json() as any;
      const content = data.choices?.[0]?.message?.content || "[]";
      suggestions = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || "[]");
    } else {
      suggestions = [`${title} - Complete Guide`, `Best ${keyword || title} Tips`, `${keyword || title}: What You Need to Know`, `Ultimate ${title} Guide`, `How to Master ${keyword || title}`];
    }

    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [title] });
  }
});

router.post("/ai/internal-linking", async (req, res) => {
  const { content, postId, existingLinks = [] } = req.body;
  const openrouterKey = getEnv("OPENROUTER_API_KEY");
  const openaiKey = getEnv("OPENAI_API_KEY");

  const posts = await db.select({ id: blogPostsTable.id, title: blogPostsTable.title, slug: blogPostsTable.slug, excerpt: blogPostsTable.excerpt }).from(blogPostsTable).where(eq(blogPostsTable.status, "published")).limit(50);

  const postList = posts.map(p => `${p.title} (slug: ${p.slug})`).join("\n");
  const prompt = `Given this article content and a list of available posts, suggest 5 relevant internal links.
Available posts:\n${postList}\n\nContent snippet: ${content.slice(0, 500)}\n\nReturn JSON array: [{"keyword": "...", "targetSlug": "...", "targetTitle": "...", "relevanceScore": 0.9}]`;

  try {
    let suggestions = [];
    if (openrouterKey || openaiKey) {
      const apiKey = openrouterKey || openaiKey;
      const baseUrl = openrouterKey ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
      const model = openrouterKey ? "anthropic/claude-haiku-4" : "gpt-4o-mini";
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 1000 }),
      });
      const data = await resp.json() as any;
      const raw = data.choices?.[0]?.message?.content || "[]";
      suggestions = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] || "[]");
    } else {
      // Simple keyword matching fallback
      suggestions = posts.slice(0, 3).map(p => ({ keyword: p.title.split(" ").slice(0, 2).join(" "), targetSlug: p.slug, targetTitle: p.title, relevanceScore: 0.5 }));
    }
    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

router.post("/ai/seo-analytics", async (req, res) => {
  const { content, keyword, url } = req.body;
  const text = content.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const kwCount = keyword ? (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), "g")) || []).length : 0;
  const keywordDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
  const score = Math.min(100, Math.max(0, 50 + (wordCount > 1000 ? 20 : 0) + (keywordDensity > 0.5 && keywordDensity < 3 ? 20 : 0) + (content.includes("<h2") ? 10 : 0)));
  const suggestions: string[] = [];
  if (wordCount < 1000) suggestions.push("Content is too short. Aim for 1500+ words for better SEO.");
  if (keywordDensity < 0.5) suggestions.push("Keyword density is too low. Include your target keyword more naturally.");
  if (keywordDensity > 3) suggestions.push("Keyword density is too high. Reduce keyword stuffing.");
  if (!content.includes("<h2")) suggestions.push("Add H2 subheadings to improve content structure.");
  const readability = wordCount > 1500 ? "Good" : wordCount > 800 ? "Average" : "Poor";
  res.json({ score, suggestions, keywordDensity: Math.round(keywordDensity * 100) / 100, readability });
});

router.post("/ai/serp-analysis", async (req, res) => {
  const { keyword, language = "en" } = req.body;
  const openrouterKey = getEnv("OPENROUTER_API_KEY");
  const openaiKey = getEnv("OPENAI_API_KEY");

  if (!openrouterKey && !openaiKey) {
    res.json({ keyword, competition: "Unknown", suggestions: ["Configure AI API keys to enable SERP analysis"], relatedKeywords: [] });
    return;
  }

  const prompt = `Analyze the SEO competition for keyword: "${keyword}" in language: ${language}. Return JSON: {"competition": "low|medium|high", "suggestions": ["tip1","tip2","tip3"], "relatedKeywords": ["kw1","kw2","kw3","kw4","kw5"]}`;
  try {
    const apiKey = openrouterKey || openaiKey;
    const baseUrl = openrouterKey ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
    const model = openrouterKey ? "anthropic/claude-haiku-4" : "gpt-4o-mini";
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
    });
    const data = await resp.json() as any;
    const raw = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
    res.json({ keyword, competition: parsed.competition || "unknown", suggestions: parsed.suggestions || [], relatedKeywords: parsed.relatedKeywords || [] });
  } catch {
    res.json({ keyword, competition: "unknown", suggestions: [], relatedKeywords: [] });
  }
});

router.post("/ai/search-images", async (req, res) => {
  const { query, count = 10 } = req.body;
  const unsplashKey = getEnv("UNSPLASH_ACCESS_KEY");

  if (!unsplashKey) {
    res.json({ images: [], error: "UNSPLASH_ACCESS_KEY not configured" });
    return;
  }

  try {
    const resp = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`, {
      headers: { "Authorization": `Client-ID ${unsplashKey}` },
    });
    const data = await resp.json() as any;
    const images = (data.results || []).map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      description: img.description || img.alt_description,
      photographer: img.user?.name || "Unknown",
    }));
    res.json({ images });
  } catch {
    res.json({ images: [] });
  }
});

router.post("/ai/import-designs", async (req, res) => {
  const { storeUrl, platform, username } = req.body;
  res.json({ imported: 0, skipped: 0, errors: 0, message: `Design import from ${platform} requires scraping integration. Configure your store URL and run the import manually.` });
});

router.post("/ai/publish-scheduled", async (req, res) => {
  const now = new Date();
  const { sql } = await import("drizzle-orm");
  const scheduled = await db.select().from(blogPostsTable)
    .where(sql`status = 'scheduled' AND scheduled_publish_at <= ${now}`);

  let published = 0;
  for (const post of scheduled) {
    await db.update(blogPostsTable).set({ status: "published", published_at: now, updated_at: now }).where(eq(blogPostsTable.id, post.id));
    published++;
  }

  res.json({ published, message: `Published ${published} scheduled post(s)` });
});

export default router;
