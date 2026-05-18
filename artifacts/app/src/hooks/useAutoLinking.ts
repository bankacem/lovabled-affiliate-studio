import { useState, useEffect, useCallback } from "react";
import { useListAutoLinkKeywords } from "@workspace/api-client-react";

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BASE = import.meta.env.BASE_URL;

export function useAutoLinking() {
  const { data: keywords = [], isLoading, refetch } = useListAutoLinkKeywords();

  const applyAutoLinks = useCallback((content: string, currentPostId?: string): string => {
    let linkedContent = content;

    const activeKeywords = keywords
      .filter(k => k.is_active && k.target_post_id !== currentPostId)
      .sort((a, b) => b.keyword.length - a.keyword.length);

    activeKeywords.forEach(kw => {
      const regex = new RegExp(
        `(?<!<[^>]*?)\\b(${escapeRegex(kw.keyword)})\\b(?![^<]*?>)`,
        "gi"
      );
      let replaced = false;
      linkedContent = linkedContent.replace(regex, (match) => {
        if (replaced) return match;
        replaced = true;
        return `<a href="/blog/${kw.target_post_id}" class="auto-link">${match}</a>`;
      });
    });

    return linkedContent;
  }, [keywords]);

  const generateKeywordsFromPost = useCallback(async (post: { id: string; title: string; content?: string | null }) => {
    const titleWords = post.title.split(/\s+/).filter(w => w.length > 4).map(w => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());
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
