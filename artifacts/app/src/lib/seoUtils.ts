/**
 * SEO Utilities for URL slug optimization and content processing
 */

/**
 * Generate an SEO-friendly slug from a title
 * - Converts to lowercase
 * - Removes special characters (: ? ! @ # $ % ^ & * etc.)
 * - Replaces spaces and underscores with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 */
export function generateSEOSlug(title: string): string {
  return title
    .toLowerCase()
    // Replace Arabic/Persian numbers with English
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    // Remove special characters except alphanumeric, spaces, and hyphens
    .replace(/[^a-z0-9\s\-\u0600-\u06FF]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length for SEO (max 60 chars)
    .slice(0, 60)
    // Remove trailing hyphen if cut mid-word
    .replace(/-+$/, '');
}

/**
 * Extract all links from HTML content
 */
export function extractLinksFromContent(content: string): Array<{
  url: string;
  text: string;
  isInternal: boolean;
}> {
  const links: Array<{ url: string; text: string; isInternal: boolean }> = [];
  
  // Match all anchor tags
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];
    const text = match[2].trim();
    
    // Determine if internal (starts with / or contains our domain)
    const isInternal = url.startsWith('/') || 
      url.includes('lovabled-affiliate-studio.lovable.app') ||
      url.includes('localhost') ||
      !url.startsWith('http');
    
    links.push({ url, text, isInternal });
  }
  
  return links;
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply auto-links to content based on keywords
 * Only links first occurrence of each keyword
 * Avoids linking inside existing links or HTML tags
 */
export function applyAutoLinksToContent(
  content: string,
  keywords: Array<{
    keyword: string;
    targetSlug: string;
    targetTitle: string;
  }>,
  currentPostSlug?: string
): string {
  let linkedContent = content;
  
  // Sort by keyword length (longer first) to avoid partial replacements
  const sortedKeywords = [...keywords]
    .filter(k => k.targetSlug !== currentPostSlug)
    .sort((a, b) => b.keyword.length - a.keyword.length);

  // Track which keywords have been linked
  const linkedKeywords = new Set<string>();

  sortedKeywords.forEach(({ keyword, targetSlug, targetTitle }) => {
    // Skip if already linked this keyword.
    if (linkedKeywords.has(keyword.toLowerCase())) return;

    // Protect complete blocks where anchor markup must never be injected:
    // existing links, headings, style blocks, and JSON-LD scripts. This also
    // prevents legacy FAQ JSON strings from being corrupted by auto-linking.
    const protectedBlocks: string[] = [];
    const protectedBlockRegex = /<(a|script|style|h[1-6])\b[^>]*>[\s\S]*?<\/\1>/gi;
    const placeholderPrefix = "__AUTO_LINK_PROTECTED_";
    let safeContent = linkedContent.replace(protectedBlockRegex, (block) => {
      const placeholder = `${placeholderPrefix}${protectedBlocks.length}__`;
      protectedBlocks.push(block);
      return placeholder;
    });

    const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, "gi");
    let replaced = false;
    safeContent = safeContent.replace(regex, (match, _group, offset, source) => {
      if (replaced) return match;
      const before = source.slice(Math.max(0, offset - 1), offset);
      if (before === "<" || before === "&") return match;
      replaced = true;
      linkedKeywords.add(keyword.toLowerCase());
      return `<a href="/blog/${targetSlug}" class="auto-link internal-link" title="${targetTitle}">${match}</a>`;
    });

    linkedContent = safeContent.replace(
      new RegExp(`${placeholderPrefix}(\\d+)__`, "g"),
      (_placeholder, index) => protectedBlocks[Number(index)],
    );
  });

  return linkedContent;
}

/**
 * Check if a slug is SEO-friendly
 * Allowed characters must match what generateSEOSlug() can produce:
 * lowercase latin letters, digits, hyphens, and Arabic script (U+0600–U+06FF).
 */
export function isValidSEOSlug(slug: string): boolean {
  // Must be lowercase (Arabic has no case, so this only affects latin chars)
  if (slug !== slug.toLowerCase()) return false;

  // Must not contain special characters except hyphens, digits, latin letters, and Arabic script
  if (!/^[a-z0-9\u0600-\u06FF\-]+$/.test(slug)) return false;

  // Must not have consecutive hyphens
  if (/--/.test(slug)) return false;

  // Must not start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) return false;

  return true;
}

/**
 * Calculate keyword density for SEO analysis
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  const textContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = textContent.split(/\s+/).filter(Boolean);
  const keywordLower = keyword.toLowerCase();
  const keywordCount = words.filter(w => w.includes(keywordLower)).length;
  
  return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
}
