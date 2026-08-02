// Shared by generate-article, generate-article-openrouter, generate-article-groq,
// and generate-article-bluesminds.
//
// Root cause fix: every one of those functions used to hardcode a "p-" prefix
// on every generated slug (const slug = "p-" + title...). That meant the SAME
// keyword generated through this tool always produced a DIFFERENT slug than
// the same article imported/created another way (e.g. via Bulk Post Import),
// with no check in between — which is exactly how the site ended up with 37
// pairs of near-identical duplicate articles live under two different URLs.
//
// This module does two things before a generated article is handed back to
// the admin:
//   1. Exact slug collision check — if a post with the same slug already
//      exists, append a short numeric suffix so nothing ever silently
//      overwrites or collides.
//   2. Fuzzy title-similarity check — a cheap, dependency-free similarity
//      score against existing post titles. This does NOT block generation
//      (the admin might genuinely want a new angle on a similar topic), it
//      just surfaces a warning so a human makes the call instead of the
//      duplicate slipping through unnoticed like before.

export interface DuplicateCheckResult {
  slug: string;
  duplicateWarning: string | null;
}

function normalizeForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple, fast word-overlap similarity (Jaccard on word sets). Good enough to
// flag "this looks like the same topic" without needing an embeddings call.
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeForComparison(a).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalizeForComparison(b).split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

export async function checkAndDisambiguateSlug(
  supabaseUrl: string,
  supabaseKey: string,
  title: string,
  baseSlug: string,
): Promise<DuplicateCheckResult> {
  try {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/blog_posts?select=slug,title&order=created_at.desc&limit=500`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (!resp.ok) {
      // Duplicate-checking must never block article generation — if the
      // lookup itself fails (network, RLS, etc.), just skip the check.
      return { slug: baseSlug, duplicateWarning: null };
    }
    const existing = (await resp.json()) as Array<{ slug: string; title: string }>;
    const existingSlugs = new Set(existing.map((p) => p.slug));

    let slug = baseSlug;
    if (existingSlugs.has(slug)) {
      let n = 2;
      while (existingSlugs.has(`${baseSlug}-${n}`)) n++;
      slug = `${baseSlug}-${n}`;
    }

    let bestMatch: { title: string; score: number } | null = null;
    for (const post of existing) {
      const score = titleSimilarity(title, post.title);
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { title: post.title, score };
      }
    }

    const duplicateWarning = bestMatch
      ? `This looks similar (${Math.round(bestMatch.score * 100)}% word overlap) to an existing published post: "${bestMatch.title}". Consider merging into that article instead of publishing a near-duplicate.`
      : null;

    return { slug, duplicateWarning };
  } catch {
    return { slug: baseSlug, duplicateWarning: null };
  }
}
