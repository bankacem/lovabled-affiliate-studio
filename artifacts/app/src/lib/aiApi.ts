import { adminFetch } from "@/lib/adminApi";

const providerForFunction: Record<string, string> = {
  "generate-article": "lovable",
  "generate-article-openrouter": "openrouter",
  "generate-article-groq": "groq",
  "generate-article-bluesminds": "bluesminds",
};

export async function invokeAI<T = unknown>(functionName: string, body: Record<string, unknown> = {}): Promise<T> {
  if (functionName.startsWith("generate-article")) {
    return adminFetch<T>("/ai/generate-article", {
      method: "POST",
      body: JSON.stringify({ ...body, provider: providerForFunction[functionName] || "openrouter" }),
    });
  }
  const endpointMap: Record<string, string> = {
    "evaluate-article": "/ai/evaluate-article",
    "analyze-competitors": "/ai/analyze-competitors",
    "ai-internal-linking": "/ai/internal-linking",
    "seo-analytics": "/ai/seo-analytics",
    "serp-analysis": "/ai/serp-analysis",
    "search-unsplash": "/ai/search-images",
    "optimize-title": "/ai/optimize-title",
    "publish-scheduled-posts": "/ai/publish-scheduled",
    "import-designs": "/ai/import-designs",
  };
  const endpoint = endpointMap[functionName];
  if (!endpoint) throw new Error(`Unsupported AI operation: ${functionName}`);
  return adminFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
