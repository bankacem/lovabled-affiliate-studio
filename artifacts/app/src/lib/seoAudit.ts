/**
 * SEO Content Quality Audit Utility
 * Calculates quality scores (0-100) and extracts detailed metrics for pages.
 */

export interface AuditDetails {
  score: number;
  wordCount: number;
  deductions: { reason: string; points: number }[];
  recommendations: string[];
}

export function cleanHtmlText(html: string): string {
  if (!html) return "";
  // Strip script, style tags first
  let clean = html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  // Strip all HTML tags
  clean = clean.replace(/<[^>]*>/g, " ");
  // Decode HTML entities
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Normalize whitespaces
  return clean.replace(/\s+/g, " ").trim();
}

const AI_PATTERNS = [
  "in conclusion",
  "tapestry of",
  "not only but also",
  "delve into",
  "testament to",
  "crucial to remember",
  "vital role",
  "it's important to note",
  "realm of",
  "moreover",
  "furthermore"
];

const PLACEHOLDERS = [
  "lorem ipsum",
  "placeholder",
  "todo",
  "insert here",
  "text goes here",
  "your name here",
  "[insert",
  "[your"
];

export function calculateQualityScore(page: any, type: "blog" | "design", options?: {
  isDuplicateIntro?: boolean;
  isDuplicateOutro?: boolean;
  isDuplicateTitle?: boolean;
  isDuplicateDescription?: boolean;
  isKeywordCannibalized?: boolean;
}): number {
  return calculateQualityDetails(page, type, options).score;
}

export function calculateQualityDetails(page: any, type: "blog" | "design", options?: {
  isDuplicateIntro?: boolean;
  isDuplicateOutro?: boolean;
  isDuplicateTitle?: boolean;
  isDuplicateDescription?: boolean;
  isKeywordCannibalized?: boolean;
}): AuditDetails {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const recommendations: string[] = [];
  let wordCount = 0;

  if (type === "blog") {
    // 1. Missing Title / H1
    const title = (page.title || "").trim();
    if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
      score -= 40;
      deductions.push({ reason: "Missing or generic H1/Title", points: 40 });
      recommendations.push("Add a specific and optimized H1 Title.");
    }

    // 2. Word count (only run if content is fetched/defined)
    const content = page.content;
    if (content !== undefined) {
      const cleanText = cleanHtmlText(content || "");
      const words = cleanText.split(/\s+/).filter(Boolean);
      wordCount = words.length;

      if (wordCount === 0) {
        score -= 100;
        deductions.push({ reason: "No content found on informational page", points: 100 });
        recommendations.push("Write a comprehensive article with at least 800 words.");
      } else if (wordCount < 250) {
        score -= 45;
        deductions.push({ reason: `Extremely thin content (${wordCount} words)`, points: 45 });
        recommendations.push("Increase content length significantly; aim for at least 800 words.");
      } else if (wordCount < 500) {
        score -= 30;
        deductions.push({ reason: `Thin content (${wordCount} words)`, points: 30 });
        recommendations.push("Expand on the article's details to solve user query thoroughly.");
      } else if (wordCount < 800) {
        score -= 15;
        deductions.push({ reason: `Below recommended 800 words (${wordCount} words)`, points: 15 });
        recommendations.push("Add sub-topics or visual/textual details to cross 800 words.");
      } else if (wordCount >= 1200) {
        score += 5; // Reward long-form content
      }

      // 3. Duplicate introductions / conclusions
      if (options?.isDuplicateIntro) {
        score -= 20;
        deductions.push({ reason: "Duplicated Introduction paragraph", points: 20 });
        recommendations.push("Rewrite the introduction to make it unique and engaging.");
      }
      if (options?.isDuplicateOutro) {
        score -= 20;
        deductions.push({ reason: "Duplicated Conclusion paragraph", points: 20 });
        recommendations.push("Rewrite the conclusion to avoid repetitive boilerplates.");
      }

      // 4. AI Repetitive Patterns
      let aiMatchCount = 0;
      const cleanLower = cleanText.toLowerCase();
      AI_PATTERNS.forEach((pattern) => {
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        const matches = cleanLower.match(regex);
        if (matches && matches.length > 2) {
          aiMatchCount += matches.length;
        }
      });

      if (aiMatchCount > 5) {
        score -= 15;
        deductions.push({ reason: `Excessive AI boilerplate phrases (${aiMatchCount} matches)`, points: 15 });
        recommendations.push("Rewrite content to sound more human-like; remove repetitive transition phrases.");
      }

      // 5. Placeholder text in content
      let placeholderMatch = false;
      PLACEHOLDERS.forEach((placeholder) => {
        if (cleanLower.includes(placeholder)) {
          placeholderMatch = true;
        }
      });
      if (placeholderMatch) {
        score -= 25;
        deductions.push({ reason: "Contains placeholder text/TODOs", points: 25 });
        recommendations.push("Remove any placeholder text or incomplete TODO brackets.");
      }

      // 9. Missing FAQ Section
      const faqKeywords = ["faq", "frequently asked", "frequent questions", "أسئلة شائعة", "سؤال وجواب"];
      const hasFaq = faqKeywords.some(kw => cleanLower.includes(kw));
      if (!hasFaq && wordCount > 0) {
        score -= 5;
        deductions.push({ reason: "Missing FAQ section", points: 5 });
        recommendations.push("Add a Frequently Asked Questions (FAQ) section to target rich search snippets.");
      }
    }

    // 6. Missing Meta Description
    const metaDesc = (page.meta_description || "").trim();
    if (!metaDesc) {
      score -= 15;
      deductions.push({ reason: "Missing Meta Description", points: 15 });
      recommendations.push("Add a high-CTR meta description (120-160 characters).");
    } else if (metaDesc.length < 80) {
      score -= 5;
      deductions.push({ reason: `Meta Description too short (${metaDesc.length} chars)`, points: 5 });
      recommendations.push("Expand the meta description to at least 100-160 characters.");
    }

    // 7. Missing OG Image
    const ogImage = page.featured_image || page.image_url || "";
    if (!ogImage || !ogImage.startsWith("http")) {
      score -= 15;
      deductions.push({ reason: "Missing or invalid OG Featured Image", points: 15 });
      recommendations.push("Provide a high-quality featured image URL.");
    }

    // 8. Missing Structured Data inputs
    if (!page.author_name || (!page.published_at && !page.created_at)) {
      score -= 10;
      deductions.push({ reason: "Missing metadata for Article Structured Data (Author/Dates)", points: 10 });
      recommendations.push("Ensure author name and publish dates are properly filled.");
    }

    // 10. Duplicate Title/Desc & Keyword Cannibalization
    if (options?.isDuplicateTitle) {
      score -= 15;
      deductions.push({ reason: "Duplicate Page Title / Meta Title with another page", points: 15 });
      recommendations.push("Make the title unique; avoid having identical title tags.");
    }
    if (options?.isDuplicateDescription) {
      score -= 10;
      deductions.push({ reason: "Duplicate Meta Description with another page", points: 10 });
      recommendations.push("Write a unique meta description targeting this page's topic.");
    }
    if (options?.isKeywordCannibalized) {
      score -= 10;
      deductions.push({ reason: "Target keyword cannibalization detected", points: 10 });
      recommendations.push("Consolidate or rewrite to focus on a unique keyword, or merge pages.");
    }

  } else if (type === "design") {
    // 1. Missing Name (H1)
    const name = (page.name || "").trim();
    if (!name || name.toLowerCase().includes("untitled") || name.toLowerCase() === "no name") {
      score -= 40;
      deductions.push({ reason: "Missing or generic Design Name", points: 40 });
      recommendations.push("Assign a specific, descriptive name/title to the design.");
    }

    // 2. Word count / Description check
    const desc = page.description || "";
    const cleanDesc = cleanHtmlText(desc);
    const descWords = cleanDesc.split(/\s+/).filter(Boolean);
    wordCount = descWords.length;

    if (wordCount === 0) {
      score -= 40;
      deductions.push({ reason: "Missing design description", points: 40 });
      recommendations.push("Write a description (at least 30-50 words) detailing the style and concept.");
    } else if (wordCount < 30) {
      score -= 25;
      deductions.push({ reason: `Extremely short description (${wordCount} words)`, points: 25 });
      recommendations.push("Expand the description to at least 40-100 words for search engines.");
    } else if (wordCount < 80) {
      score -= 10;
      deductions.push({ reason: `Brief description (${wordCount} words)`, points: 10 });
      recommendations.push("Elaborate on color palettes, design aesthetics, or print recommendation.");
    }

    // 3. Missing Image
    const imageUrl = page.image_url || "";
    if (!imageUrl || !imageUrl.startsWith("http")) {
      score -= 40;
      deductions.push({ reason: "Missing or invalid main Design Image", points: 40 });
      recommendations.push("Upload a valid product/mockup image.");
    }

    // 4. Missing External Store links
    const hasStoreLink = !!(page.teepublic_url || page.redbubble_url || page.amazon_url || page.etsy_url);
    if (!hasStoreLink) {
      score -= 30;
      deductions.push({ reason: "No affiliate/store purchase link provided", points: 30 });
      recommendations.push("Link to at least one active store platform (Teepublic, Redbubble, Etsy, Amazon).");
    }

    // 5. Missing Tags
    const tags = page.tags || [];
    if (tags.length === 0) {
      score -= 10;
      deductions.push({ reason: "No tags defined", points: 10 });
      recommendations.push("Add 5-15 relevant descriptive tags.");
    }

    // 6. Placeholder / Boilerplate
    let placeholderMatch = false;
    const descLower = cleanDesc.toLowerCase();
    PLACEHOLDERS.forEach((placeholder) => {
      if (descLower.includes(placeholder)) {
        placeholderMatch = true;
      }
    });
    if (placeholderMatch) {
      score -= 25;
      deductions.push({ reason: "Description contains placeholders", points: 25 });
      recommendations.push("Remove template or placeholder text from design descriptions.");
    }

    // 7. Duplicate Title / Description
    if (options?.isDuplicateTitle) {
      score -= 15;
      deductions.push({ reason: "Duplicate Design Name with another design", points: 15 });
      recommendations.push("Differentiate the design name to make it unique.");
    }
    if (options?.isDuplicateDescription) {
      score -= 10;
      deductions.push({ reason: "Duplicate Design Description with another design", points: 10 });
      recommendations.push("Write a unique description detailing this specific design asset.");
    }
  }

  // Bound score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wordCount,
    deductions,
    recommendations
  };
}
