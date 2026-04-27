import { slugify } from "./slugify";

/**
 * SEO Utilities for URL slug optimization and content processing
 */

/**
 * Generate an SEO-friendly slug from a title
 * Uses the standardized slugify utility.
 * @param title The title to convert
 * @param suffix Optional suffix to append (e.g., "-shirt")
 */
export function generateSEOSlug(title: string, suffix?: string): string {
  // Pre-process for Arabic/Persian numbers if needed
  const processedTitle = title
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  let slug = slugify(processedTitle).slice(0, 100).replace(/-+$/, '');

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
 * Used to prevent duplication when providing JSON-LD.
 * Uses a tag-aware approach to avoid breaking HTML structure or removing text content.
 */
export function stripMicrodata(html: string): string {
  if (!html) return '';

  // This regex matches HTML tags while correctly handling quotes to avoid stopping at > inside an attribute
  const tagRegex = /<(?:[^"'>]|"[^"]*"|'[^']*')*>/g;

  return html.replace(tagRegex, (tag) => {
    // Skip closing tags as they don't have attributes
    if (tag.startsWith('</')) return tag;

    return tag
      // Remove itemtype and itemprop with quoted values, ensuring we don't cross to another tag
      // We use [^"'>]* to ensure we stay within the current attribute's quotes and the tag itself
      .replace(/\s(itemtype|itemprop)=["'][^"'>]*["']/gi, '')
      // Handle unquoted attributes (though rare for microdata)
      .replace(/\s(itemtype|itemprop)=[^"'\s>]+/gi, '')
      // Remove itemscope only if it's a standalone attribute (followed by space or >)
      // This prevents accidental removal from class names like "my-itemscope"
      .replace(/\sitemscope(?=[\s>])/gi, '');
  });
}

/**
 * SEO Health Check Utility
 * Scans a list of blog posts for potential SEO issues:
 * - Slugs longer than 75 characters
 * - Missing featured images
 * @param posts Array of blog posts to check
 */
export function runSEOHealthCheck(posts: any[]): void {
  if (!posts || posts.length === 0) return;

  // FIXED: Diagnostic console logs removed for production hygiene.
  // The structure of the check remains for future expansion into UI-based reporting.
  posts.forEach(post => {
    const slug = post.slug || "";
    const hasImage = !!post.featured_image;

    // Check for issues but don't log to console in production
    const isSlugTooLong = slug.length > 75;
    const isImageMissing = !hasImage;

    // Logic for reporting these to an internal state/API could go here
    if (isSlugTooLong || isImageMissing) {
      // Logic for internal reporting
    }
  });
}
