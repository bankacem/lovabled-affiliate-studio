import { useState, useEffect, useCallback, useMemo } from "react";
import { useListBlogPosts } from "@workspace/api-client-react";

interface SmartLinkPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  indexing_status: "indexed" | "pending";
  excerpt?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
}

interface SmartLinkSuggestion {
  post: SmartLinkPost;
  relevanceScore: number;
  matchReason: string[];
}

const BASE = import.meta.env.BASE_URL;

export function useSmartLinking(currentPostId?: string) {
  const { data: paginatedData, isLoading, refetch } = useListBlogPosts({ status: "published", pageSize: 200 });
  const allPostsRaw = paginatedData?.posts ?? [];

  const allPosts: SmartLinkPost[] = allPostsRaw.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    tags: post.tags ?? [],
    indexing_status: (post.indexing_status as "indexed" | "pending") || "pending",
    excerpt: post.excerpt,
    featured_image: post.featured_image,
    published_at: post.published_at,
  }));

  const indexedPosts = useMemo(() => allPosts.filter(p => p.indexing_status === "indexed"), [allPosts]);
  const pendingPosts = useMemo(() => allPosts.filter(p => p.indexing_status === "pending"), [allPosts]);

  const calculateRelevance = useCallback((sourcePost: SmartLinkPost, targetPost: SmartLinkPost) => {
    let score = 0;
    const reasons: string[] = [];
    if (sourcePost.category === targetPost.category) { score += 50; reasons.push(`Same category: ${sourcePost.category}`); }
    const sourceTags = sourcePost.tags.map(t => t.toLowerCase());
    const targetTags = targetPost.tags.map(t => t.toLowerCase());
    const matchingTags = sourceTags.filter(t => targetTags.includes(t));
    if (matchingTags.length > 0) { score += matchingTags.length * 20; reasons.push(`Matching tags: ${matchingTags.join(", ")}`); }
    if (targetPost.published_at) {
      const daysSince = Math.floor((Date.now() - new Date(targetPost.published_at).getTime()) / 86400000);
      if (daysSince <= 7) { score += 15; reasons.push("Recently published"); }
    }
    return { score, reasons };
  }, []);

  const getSuggestions = useCallback((
    currentPost: { category: string; tags: string[] },
    options: { limit?: number; prioritizePending?: boolean; excludeIds?: string[] } = {}
  ): SmartLinkSuggestion[] => {
    const { limit = 3, prioritizePending = true, excludeIds = [] } = options;
    const sourcePost: SmartLinkPost = { id: currentPostId || "current", title: "", slug: "", category: currentPost.category, tags: currentPost.tags, indexing_status: "indexed" };
    return allPosts
      .filter(p => p.id !== currentPostId && !excludeIds.includes(p.id))
      .map(post => { const { score, reasons } = calculateRelevance(sourcePost, post); return { post, relevanceScore: score, matchReason: reasons }; })
      .filter(s => s.relevanceScore > 0)
      .sort((a, b) => {
        if (prioritizePending) {
          const diff = (b.post.indexing_status === "pending" ? 1 : 0) - (a.post.indexing_status === "pending" ? 1 : 0);
          if (diff !== 0) return diff;
        }
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, limit);
  }, [allPosts, currentPostId, calculateRelevance]);

  const isCurrentPageIndexed = useCallback((postId: string) => allPosts.find(p => p.id === postId)?.indexing_status === "indexed", [allPosts]);

  const getPendingSuggestionsForIndexedPage = useCallback((
    currentPost: { id: string; category: string; tags: string[] }, limit = 3
  ) => {
    if (!isCurrentPageIndexed(currentPost.id)) return [];
    return getSuggestions({ category: currentPost.category, tags: currentPost.tags }, { limit, prioritizePending: true, excludeIds: [currentPost.id] })
      .filter(s => s.post.indexing_status === "pending");
  }, [getSuggestions, isCurrentPageIndexed]);

  const updateIndexingStatus = useCallback(async (postId: string, status: "indexed" | "pending"): Promise<boolean> => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${BASE}api/blog/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ indexing_status: status }),
    });
    if (res.ok) { refetch(); return true; }
    return false;
  }, [refetch]);

  const bulkUpdateIndexingStatus = useCallback(async (postIds: string[], status: "indexed" | "pending"): Promise<boolean> => {
    const token = localStorage.getItem("auth_token");
    const results = await Promise.all(postIds.map(id =>
      fetch(`${BASE}api/blog/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ indexing_status: status }),
      })
    ));
    const allOk = results.every(r => r.ok);
    if (allOk) refetch();
    return allOk;
  }, [refetch]);

  return { allPosts, indexedPosts, pendingPosts, isLoading, getSuggestions, getPendingSuggestionsForIndexedPage, isCurrentPageIndexed, updateIndexingStatus, bulkUpdateIndexingStatus, refetch };
}
