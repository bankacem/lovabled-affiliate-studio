// Free, instant, rule-based quality checks — no API call, no cost. Deliberately
// mirrors the exact same heuristics already proven in
// seoagent-export/seo-audit-seoagent.ts, so the "evaluation agent" agrees
// with the standalone audit tool instead of inventing a second, different
// standard.

export interface RuleCheckResult {
  score: number; // 0-100
  issues: string[];
}

const AI_CLICHE_PHRASES = [
  "in conclusion", "in today's digital", "delve into", "tapestry of",
  "in the world of", "when it comes to", "it's important to note",
  "unlock the", "elevate your", "game-changer", "in this article, we will",
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function runRuleChecks(params: {
  content: string;
  includeFAQ: boolean;
  includeComparisonTable: boolean;
  metaDescription?: string;
}): RuleCheckResult {
  const { content, includeFAQ, includeComparisonTable, metaDescription } = params;
  const text = stripHtml(content);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  let score = 100;
  const issues: string[] = [];

  if (wordCount < 800) {
    const penalty = Math.min(30, Math.round((800 - wordCount) / 20));
    score -= penalty;
    issues.push(`Too short: ${wordCount} words (recommended 800+).`);
  }

  const lowerText = text.toLowerCase();
  const foundCliches = AI_CLICHE_PHRASES.filter((p) => lowerText.includes(p));
  if (foundCliches.length > 0) {
    score -= Math.min(20, foundCliches.length * 5);
    issues.push(`AI-sounding clichés found: ${foundCliches.join(", ")}.`);
  }

  if (/\[(image|placeholder|insert|todo|tbd)\]/i.test(content)) {
    score -= 15;
    issues.push("Leftover placeholder text found (e.g. [IMAGE], [TODO]).");
  }

  if (includeFAQ && !/faq|frequently asked/i.test(content)) {
    score -= 10;
    issues.push("FAQ section was requested but not found.");
  }

  if (includeComparisonTable && !/<table/i.test(content)) {
    score -= 10;
    issues.push("Comparison table was requested but not found.");
  }

  const h2Count = (content.match(/<h2/gi) || []).length;
  if (h2Count < 2) {
    score -= 10;
    issues.push(`Weak structure: only ${h2Count} H2 section(s).`);
  }

  if (metaDescription && (metaDescription.length < 70 || metaDescription.length > 165)) {
    score -= 5;
    issues.push(`Meta description length (${metaDescription.length} chars) outside the 70-165 recommended range.`);
  }

  return { score: Math.max(0, score), issues };
}
