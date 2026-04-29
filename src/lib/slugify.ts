/**
 * Minimal slug normalisation.
 * Only replaces underscores/spaces with hyphens.
 * Does NOT strip other characters - DB slugs may contain numbers etc.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
