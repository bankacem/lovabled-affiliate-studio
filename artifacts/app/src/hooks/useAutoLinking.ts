import { useCallback } from "react";
import { useListAutoLinkKeywords } from "@workspace/api-client-react";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BASE = import.meta.env.BASE_URL;
const MAX_LINKS_PER_POST = 5;

// Whitelist of authoritative external domains — we auto-add rel="noopener nofollow"
// to any external link so we never leak PageRank to spam.
const AUTHORITATIVE_HOSTS = ["wikipedia.org", "google.com", "trends.google.com", "shopify.com", "teepublic.com", "redbubble.com"];

export function useAutoLinking() {
  const { data: keywords = [], isLoading, refetch } = useListAutoLinkKeywords();

  const applyAutoLinks = useCallback((content: string, currentPostId?: string): string => {
    let linked = content;

    // Sort by keyword length desc so longer phrases match first (avoids partial overlaps).
    const active = keywords
      .filter((k: any) => k.is_active && k.target_post_id !== currentPostId)
      .sort((a: any, b: any) => b.keyword.length - a.keyword.length);

    let linksAdded = 0;
    const usedTargets = new Set<string>();

    for (const kw of active) {
      if (linksAdded >= MAX_LINKS_PER_POST) break;
      if (usedTargets.has(kw.target_post_id)) continue;

      // Match only outside existing anchor tags and outside HTML attributes.
      const regex = new RegExp(`(?<!<[^>]*?)\\b(${escapeRegex(kw.keyword)})\\b(?![^<]*?>)`, "i");
      let replaced = false;
      linked = linked.replace(regex, (match) => {
        if (replaced) return match;
        replaced = true;
        linksAdded++;
        usedTargets.add(kw.target_post_id);
        const slugOrId = kw.target_slug || kw.target_post_id;
        return `<a href="/blog/${slugOrId}" class="auto-link text-primary underline-offset-2 hover:underline">${match}</a>`;
      });
    }

    // Enhance external links: add target/rel + underline for authority hosts.
    linked = linked.replace(/<a\s+([^>]*?)href=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi, (m, pre, q, href, post) => {
      if (/rel=/.test(m) && /target=/.test(m)) return m;
      const isAuth = AUTHORITATIVE_HOSTS.some((h) => href.includes(h));
      const rel = isAuth ? 'rel="noopener external"' : 'rel="noopener nofollow external"';
      return `<a ${pre}href=${q}${href}${q}${post} target="_blank" ${rel}>`;
    });

    return linked;
  }, [keywords]);

  const generateKeywordsFromPost = useCallback(async (post: { id: string; title: string; content?: string | null }) => {
    const titleWords = post.title.split(/\s+/).filter((w) => w.length > 4).map((w) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
    const words = post.title.split(/\s+/);
    const phrases: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(" "));
      if (i < words.length - 2) phrases.push(words.slice(i, i + 3).join(" "));
    }
    const allKeywords = [...new Set([...titleWords, ...phrases])];
    const token = localStorage.getItem("auth_token");
    for (const keyword of allKeywords) {
      await fetch(`${BASE}api/seo/auto-link-keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ keyword: keyword.toLowerCase(), target_post_id: post.id, priority: keyword.split(" ").length, is_active: true }),
      }).catch(() => {});
    }
    refetch();
  }, [refetch]);

  return { keywords, isLoading, applyAutoLinks, generateKeywordsFromPost, refetch };
}
