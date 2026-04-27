/**
 * Standardized slugify function to ensure consistent URL generation across the application.
 * Following the "Plug & Play" solution to fix 404 and sitemap issues.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove all non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, "-")        // Replace spaces with hyphens
    .replace(/-+/g, "-")         // Replace multiple hyphens with a single one
    .replace(/^-+|-+$/g, "");    // Remove leading and trailing hyphens
}
