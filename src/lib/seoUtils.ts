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
 * @param title The title to convert
 * @param suffix Optional suffix to append (e.g., "-shirt")
 */
export function generateSEOSlug(title: string, suffix?: string): string {
  let slug = title
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
    // Limit length for SEO (max 100 chars)
    .slice(0, 100)
    // Remove trailing hyphen if cut mid-word
    .replace(/-+$/, '');

  if (suffix) {
    const cleanSuffix = suffix.startsWith('-') ? suffix : `-${suffix}`;
    if (!slug.endsWith(cleanSuffix.toLowerCase())) {
      slug += cleanSuffix.toLowerCase();
    }
  }

  return slug;
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
    // Skip if already linked this keyword
    if (linkedKeywords.has(keyword.toLowerCase())) return;
    
    // Create regex that:
    // 1. Does not match inside HTML tags
    // 2. Does not match inside existing links
    // 3. Matches whole words only
    const regex = new RegExp(
      `(?<!<[^>]*)(?<!<a[^>]*>)\\b(${escapeRegex(keyword)})\\b(?![^<]*>)(?![^<]*</a>)`,
      'gi'
    );

    // Replace only first occurrence
    let replaced = false;
    linkedContent = linkedContent.replace(regex, (match) => {
      if (replaced) return match;
      replaced = true;
      linkedKeywords.add(keyword.toLowerCase());
      return `<a href="/blog/${targetSlug}" class="auto-link internal-link" title="${targetTitle}">${match}</a>`;
    });
  });

  return linkedContent;
}

/**
 * Check if a slug is SEO-friendly
 */
export function isValidSEOSlug(slug: string): boolean {
  // Must be lowercase
  if (slug !== slug.toLowerCase()) return false;
  
  // Must not contain special characters except hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  
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

/**
 * Remove Schema.org Microdata attributes from HTML content
 * Used to prevent duplication when providing JSON-LD
 */
export function stripMicrodata(html: string): string {
  if (!html) return '';

  return html
    // Remove itemscope attribute
    .replace(/\sitemscope\b/gi, '')
    // Remove itemtype="..." or itemtype='...'
    .replace(/\sitemtype=["'][^"']*["']/gi, '')
    // Remove itemprop="..." or itemprop='...'
    .replace(/\sitemprop=["'][^"']*["']/gi, '');
}
