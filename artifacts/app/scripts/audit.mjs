import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");

const SUPABASE_URL = "https://krugmbovsjjgjikgzacl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydWdtYm92c2pqZ2ppa2d6YWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzU3MzAsImV4cCI6MjA4MDk1MTczMH0.d5BKf5JTYjFQLUG62VX5lEEpLD8OnJXe14x1ickCDWQ";

async function fetchAll(table, select, extraQuery = "") {
  const all = [];
  const pageSize = 1000;
  let from = 0;
  try {
    while (true) {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${extraQuery ? `&${extraQuery}` : ""}`;
      const r = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${from}-${from + pageSize - 1}`,
          "Range-Unit": "items",
          Prefer: "count=exact",
        },
      });
      if (!r.ok) {
        console.warn(`[audit-fetch] ${table} -> ${r.status} ${await r.text().catch(() => "")}`);
        break;
      }
      const rows = await r.json();
      all.push(...rows);
      if (rows.length < pageSize) break;
      from += pageSize;
      if (from > 20000) break; // safety
    }
  } catch (e) {
    console.warn(`[audit-fetch] ${table} failed:`, e.message);
  }
  return all;
}

function cleanHtmlText(html) {
  if (!html) return "";
  let clean = html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  clean = clean
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

function calculateQualityDetails(page, type, options) {
  let score = 100;
  const deductions = [];
  const recommendations = [];
  let wordCount = 0;

  if (type === "blog") {
    const title = (page.title || "").trim();
    if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
      score -= 40;
      deductions.push({ reason: "Missing or generic H1/Title", points: 40 });
      recommendations.push("Add a specific and optimized H1 Title.");
    }

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
        score += 5;
      }

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

      const faqKeywords = ["faq", "frequently asked", "frequent questions", "أسئلة شائعة", "سؤال وجواب"];
      const hasFaq = faqKeywords.some(kw => cleanLower.includes(kw));
      if (!hasFaq && wordCount > 0) {
        score -= 5;
        deductions.push({ reason: "Missing FAQ section", points: 5 });
        recommendations.push("Add a Frequently Asked Questions (FAQ) section to target rich search snippets.");
      }
    }

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

    const ogImage = page.featured_image || page.image_url || "";
    if (!ogImage || !ogImage.startsWith("http")) {
      score -= 15;
      deductions.push({ reason: "Missing or invalid OG Featured Image", points: 15 });
      recommendations.push("Provide a high-quality featured image URL.");
    }

    if (!page.author_name || (!page.published_at && !page.created_at)) {
      score -= 10;
      deductions.push({ reason: "Missing metadata for Article Structured Data (Author/Dates)", points: 10 });
      recommendations.push("Ensure author name and publish dates are properly filled.");
    }

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
    const name = (page.name || "").trim();
    if (!name || name.toLowerCase().includes("untitled") || name.toLowerCase() === "no name") {
      score -= 40;
      deductions.push({ reason: "Missing or generic Design Name", points: 40 });
      recommendations.push("Assign a specific, descriptive name/title to the design.");
    }

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

    const imageUrl = page.image_url || "";
    if (!imageUrl || !imageUrl.startsWith("http")) {
      score -= 40;
      deductions.push({ reason: "Missing or invalid main Design Image", points: 40 });
      recommendations.push("Upload a valid product/mockup image.");
    }

    const hasStoreLink = !!(page.teepublic_url || page.redbubble_url || page.amazon_url || page.etsy_url);
    if (!hasStoreLink) {
      score -= 30;
      deductions.push({ reason: "No affiliate/store purchase link provided", points: 30 });
      recommendations.push("Link to at least one active store platform (Teepublic, Redbubble, Etsy, Amazon).");
    }

    const tags = page.tags || [];
    if (tags.length === 0) {
      score -= 10;
      deductions.push({ reason: "No tags defined", points: 10 });
      recommendations.push("Add 5-15 relevant descriptive tags.");
    }

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

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wordCount,
    deductions,
    recommendations
  };
}

console.log("Starting Content Quality and SEO Audit...");

// 1. Fetch All Data
const posts = await fetchAll("blog_posts", "id,title,slug,excerpt,content,featured_image,author_name,category,tags,keywords,meta_title,meta_description,status,published_at,created_at,updated_at", "status=eq.published");
const designs = await fetchAll("designs", "id,name,description,image_url,category,tags,teepublic_url,redbubble_url,amazon_url,etsy_url,featured,created_at,updated_at");

console.log(`Fetched ${posts.length} published blog posts and ${designs.length} designs.`);

// 2. Pre-process and analyze duplicates
const cleanedIntros = new Map();
const cleanedOutros = new Map();
const titlesMap = new Map();
const descMap = new Map();
const cannibalizedKeywords = new Map();

// Helper to get normalized string snippet
function getSnippet(text, isStart = true) {
  if (!text) return "";
  const clean = cleanHtmlText(text).toLowerCase();
  return isStart ? clean.slice(0, 150) : clean.slice(-150);
}

// Group posts for duplicate checking
posts.forEach((post) => {
  const intro = getSnippet(post.content, true);
  if (intro && intro.length > 50) {
    if (!cleanedIntros.has(intro)) cleanedIntros.set(intro, []);
    cleanedIntros.get(intro).push(post.id);
  }

  const outro = getSnippet(post.content, false);
  if (outro && outro.length > 50) {
    if (!cleanedOutros.has(outro)) cleanedOutros.set(outro, []);
    cleanedOutros.get(outro).push(post.id);
  }

  const normalizedTitle = (post.title || "").trim().toLowerCase();
  if (normalizedTitle) {
    if (!titlesMap.has(normalizedTitle)) titlesMap.set(normalizedTitle, []);
    titlesMap.get(normalizedTitle).push(post.id);
  }

  const normalizedDesc = (post.meta_description || "").trim().toLowerCase();
  if (normalizedDesc) {
    if (!descMap.has(normalizedDesc)) descMap.set(normalizedDesc, []);
    descMap.get(normalizedDesc).push(post.id);
  }

  // Keywords cannibalization
  const kwList = post.keywords || [];
  kwList.forEach((kw) => {
    const normKw = kw.trim().toLowerCase();
    if (normKw) {
      if (!cannibalizedKeywords.has(normKw)) cannibalizedKeywords.set(normKw, []);
      cannibalizedKeywords.get(normKw).push(post.id);
    }
  });
});

// Group designs for duplicate checking
const designTitlesMap = new Map();
const designDescMap = new Map();
designs.forEach((d) => {
  const normalizedTitle = (d.name || "").trim().toLowerCase();
  if (normalizedTitle) {
    if (!designTitlesMap.has(normalizedTitle)) designTitlesMap.set(normalizedTitle, []);
    designTitlesMap.get(normalizedTitle).push(d.id);
  }

  const normalizedDesc = cleanHtmlText(d.description || "").trim().toLowerCase();
  if (normalizedDesc && normalizedDesc.length > 10) {
    if (!designDescMap.has(normalizedDesc)) designDescMap.set(normalizedDesc, []);
    designDescMap.get(normalizedDesc).push(d.id);
  }
});

// 3. Orphaned Pages Detection (Blog Posts)
const referencedSlugs = new Set();
posts.forEach((sourcePost) => {
  const content = sourcePost.content || "";
  const blogLinkRegex = /\/blog\/([a-zA-Z0-9\-_]+)/gi;
  let match;
  while ((match = blogLinkRegex.exec(content)) !== null) {
    referencedSlugs.add(match[1]);
  }
});

// 4. Perform Detailed Audits
const auditedPosts = [];
const auditedDesigns = [];

let totalScorePosts = 0;
let totalScoreDesigns = 0;

posts.forEach((post) => {
  const intro = getSnippet(post.content, true);
  const outro = getSnippet(post.content, false);
  const title = (post.title || "").trim().toLowerCase();
  const desc = (post.meta_description || "").trim().toLowerCase();

  const isDuplicateIntro = intro && cleanedIntros.has(intro) && cleanedIntros.get(intro).length > 1;
  const isDuplicateOutro = outro && cleanedOutros.has(outro) && cleanedOutros.get(outro).length > 1;
  const isDuplicateTitle = title && titlesMap.has(title) && titlesMap.get(title).length > 1;
  const isDuplicateDescription = desc && descMap.has(desc) && descMap.get(desc).length > 1;

  let isKeywordCannibalized = false;
  const kwList = post.keywords || [];
  kwList.forEach((kw) => {
    const normKw = kw.trim().toLowerCase();
    if (normKw && cannibalizedKeywords.has(normKw) && cannibalizedKeywords.get(normKw).length > 1) {
      isKeywordCannibalized = true;
    }
  });

  const details = calculateQualityDetails(post, "blog", {
    isDuplicateIntro,
    isDuplicateOutro,
    isDuplicateTitle,
    isDuplicateDescription,
    isKeywordCannibalized,
  });

  const isOrphaned = !referencedSlugs.has(post.slug);

  auditedPosts.push({
    post,
    details,
    isOrphaned,
    isDuplicateIntro,
    isDuplicateOutro,
    isDuplicateTitle,
    isDuplicateDescription,
    isKeywordCannibalized,
  });

  totalScorePosts += details.score;
});

designs.forEach((d) => {
  const title = (d.name || "").trim().toLowerCase();
  const desc = cleanHtmlText(d.description || "").trim().toLowerCase();

  const isDuplicateTitle = title && designTitlesMap.has(title) && designTitlesMap.get(title).length > 1;
  const isDuplicateDescription = desc && desc.length > 10 && designDescMap.has(desc) && designDescMap.get(desc).length > 1;

  const details = calculateQualityDetails(d, "design", {
    isDuplicateTitle,
    isDuplicateDescription,
  });

  auditedDesigns.push({
    design: d,
    details,
    isDuplicateTitle,
    isDuplicateDescription,
  });

  totalScoreDesigns += details.score;
});

const averagePostScore = auditedPosts.length ? Math.round(totalScorePosts / auditedPosts.length) : 0;
const averageDesignScore = auditedDesigns.length ? Math.round(totalScoreDesigns / auditedDesigns.length) : 0;

console.log(`Audit Complete! Average post quality: ${averagePostScore}, Average design quality: ${averageDesignScore}`);
