import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoLinkKeyword {
  id: string;
  keyword: string;
  target_post_id: string;
  priority: number;
  is_active: boolean;
  target_slug?: string;
  target_title?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export function useAutoLinking() {
  const [keywords, setKeywords] = useState<AutoLinkKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKeywords = useCallback(async () => {
    const { data } = await supabase
      .from("auto_link_keywords")
      .select(`
        id,
        keyword,
        target_post_id,
        priority,
        is_active
      `)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (data) {
      // Fetch target post details
      const postIds = [...new Set(data.map(k => k.target_post_id))];
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug")
        .in("id", postIds);

      const postsMap = new Map(posts?.map(p => [p.id, p]) || []);
      
      const enrichedKeywords = data.map(k => ({
        ...k,
        target_slug: (postsMap.get(k.target_post_id) as any)?.slug,
        target_title: (postsMap.get(k.target_post_id) as any)?.title,
      }));

      setKeywords(enrichedKeywords);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  // Auto-link content based on keywords
  const applyAutoLinks = useCallback((
    content: string,
    currentPostId?: string
  ): string => {
    let linkedContent = content;
    
    // Sort by keyword length (longer first) to avoid partial replacements
    const sortedKeywords = [...keywords]
      .filter(k => k.target_post_id !== currentPostId) // Don't link to self
      .sort((a, b) => b.keyword.length - a.keyword.length);

    sortedKeywords.forEach(keyword => {
      if (!keyword.target_slug) return;

      // Create regex to match whole words only, case-insensitive
      const regex = new RegExp(
        `(?<!<[^>]*?)\\b(${escapeRegex(keyword.keyword)})\\b(?![^<]*?>)`,
        "gi"
      );

      // Replace only first occurrence
      let replaced = false;
      linkedContent = linkedContent.replace(regex, (match) => {
        if (replaced) return match;
        replaced = true;
        return `<a href="/blog/${keyword.target_slug}" class="auto-link" title="${keyword.target_title}">${match}</a>`;
      });
    });

    return linkedContent;
  }, [keywords]);

  // Generate keywords from post titles
  const generateKeywordsFromPost = useCallback(async (post: BlogPost) => {
    // Extract potential keywords from title
    const titleWords = post.title
      .split(/\s+/)
      .filter(word => word.length > 4)
      .map(word => word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase());

    // Also extract 2-3 word phrases
    const words = post.title.split(/\s+/);
    const phrases: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(" "));
      if (i < words.length - 2) {
        phrases.push(words.slice(i, i + 3).join(" "));
      }
    }

    const allKeywords = [...new Set([...titleWords, ...phrases])];

    // Insert keywords (ignore duplicates)
    for (const keyword of allKeywords) {
      await supabase.from("auto_link_keywords").upsert({
        keyword: keyword.toLowerCase(),
        target_post_id: post.id,
        priority: keyword.split(" ").length, // Longer phrases get higher priority
        is_active: true,
      }, {
        onConflict: "keyword,target_post_id",
      });
    }

    await fetchKeywords();
  }, [fetchKeywords]);

  return {
    keywords,
    isLoading,
    applyAutoLinks,
    generateKeywordsFromPost,
    refetch: fetchKeywords,
  };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
