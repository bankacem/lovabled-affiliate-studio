// Canonical implementation of the "is this page good enough to publish to
// Google" quality score (0-100), used to decide which blog posts/designs
// get included in the sitemap + prerendered/static HTML.
//
// This file is intentionally plain JavaScript (no TypeScript syntax) so it
// can be imported unmodified by BOTH runtimes that need it, with zero build
// step:
//   - Deno (Supabase Edge Function): supabase/functions/sitemap/index.ts
//   - Node (Vite build script):      artifacts/app/scripts/prerender-setup.mjs
//
// Previously this exact logic was hand-copied into both of those files (plus
// a third, richer variant in artifacts/app/src/lib/seoAudit.ts for the admin
// UI). Copies drifted out of sync silently. If you change the scoring rules,
// change them ONLY here — the two build-time consumers now import this file
// directly, so there is nothing else to update for them to stay in sync.
//
// artifacts/app/src/lib/seoAudit.ts (browser/admin bundle) is NOT wired to
// import this file, because it's bundled by Vite and reaching outside
// artifacts/app/ risks dev-server file-access restrictions. It re-implements
// the same rules for the admin dashboard's live quality panel. Keep it in
// sync manually when editing this file — see the comment at the top of
// seoAudit.ts.

/**
 * @param {string} html
 * @returns {string}
 */
export function cleanHtmlText(html) {
  if (!html) return "";
  let clean = html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  clean = clean.replace(/<[^>]*>/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

/**
 * @param {any} page
 * @param {"blog" | "design"} type
 * @returns {number} score clamped to 0-100
 */
export function calculateQualityScore(page, type) {
  let score = 100;

  if (type === "blog") {
    const title = (page.title || "").trim();
    if (!title || title.toLowerCase() === "untitled" || title.toLowerCase() === "draft") {
      score -= 40;
    }
    const content = page.content || "";
    const cleanText = cleanHtmlText(content);
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 100;
    } else if (wordCount < 250) {
      score -= 45;
    } else if (wordCount < 500) {
      score -= 30;
    } else if (wordCount < 800) {
      score -= 15;
    }

    const cleanLower = cleanText.toLowerCase();
    const placeholders = ["lorem ipsum", "placeholder", "todo", "insert here", "text goes here", "[insert", "[your"];
    if (placeholders.some((p) => cleanLower.includes(p))) {
      score -= 25;
    }

    const metaDesc = (page.meta_description || "").trim();
    if (!metaDesc) {
      score -= 15;
    } else if (metaDesc.length < 80) {
      score -= 5;
    }

    const ogImage = page.featured_image || page.image_url || "";
    if (!ogImage || !ogImage.startsWith("http")) {
      score -= 15;
    }

    if (!page.author_name) {
      score -= 10;
    }
  } else if (type === "design") {
    const name = (page.name || "").trim();
    if (!name || name.toLowerCase().includes("untitled") || name.toLowerCase() === "no name") {
      score -= 40;
    }

    const desc = page.description || "";
    const cleanDesc = cleanHtmlText(desc);
    const words = cleanDesc.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount === 0) {
      score -= 40;
    } else if (wordCount < 30) {
      score -= 25;
    } else if (wordCount < 80) {
      score -= 10;
    }

    const imageUrl = page.image_url || "";
    if (!imageUrl || !imageUrl.startsWith("http")) {
      score -= 40;
    }

    const hasStoreLink = !!(page.teepublic_url || page.redbubble_url || page.amazon_url || page.etsy_url);
    if (!hasStoreLink) {
      score -= 30;
    }

    const tags = page.tags || [];
    if (tags.length === 0) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}
