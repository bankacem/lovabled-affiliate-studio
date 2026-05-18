 import { useState, useEffect, useCallback, useMemo } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface SmartLinkPost {
   id: string;
   title: string;
   slug: string;
   category: string;
   tags: string[];
   indexing_status: "indexed" | "pending";
   excerpt?: string;
   featured_image?: string;
   published_at?: string;
 }
 
 interface SmartLinkSuggestion {
   post: SmartLinkPost;
   relevanceScore: number;
   matchReason: string[];
 }
 
 export function useSmartLinking(currentPostId?: string) {
   const [allPosts, setAllPosts] = useState<SmartLinkPost[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   // Fetch all published posts with indexing status
   const fetchPosts = useCallback(async () => {
     setIsLoading(true);
     const { data, error } = await supabase
       .from("blog_posts")
       .select("id, title, slug, category, tags, indexing_status, excerpt, featured_image, published_at")
       .eq("status", "published")
       .order("published_at", { ascending: false });
 
     if (data && !error) {
       setAllPosts(data.map(post => ({
         ...post,
         tags: post.tags || [],
         indexing_status: (post.indexing_status as "indexed" | "pending") || "pending",
       })));
     }
     setIsLoading(false);
   }, []);
 
   useEffect(() => {
     fetchPosts();
   }, [fetchPosts]);
 
   // Get indexed and pending posts
   const indexedPosts = useMemo(() => 
     allPosts.filter(p => p.indexing_status === "indexed"), 
   [allPosts]);
   
   const pendingPosts = useMemo(() => 
     allPosts.filter(p => p.indexing_status === "pending"), 
   [allPosts]);
 
   // Calculate relevance score between two posts
   const calculateRelevance = useCallback((
     sourcePost: SmartLinkPost,
     targetPost: SmartLinkPost
   ): { score: number; reasons: string[] } => {
     let score = 0;
     const reasons: string[] = [];
 
     // Same category = high relevance
     if (sourcePost.category === targetPost.category) {
       score += 50;
       reasons.push(`Same category: ${sourcePost.category}`);
     }
 
     // Matching tags = medium relevance per tag
     const sourceTags = sourcePost.tags.map(t => t.toLowerCase());
     const targetTags = targetPost.tags.map(t => t.toLowerCase());
     const matchingTags = sourceTags.filter(t => targetTags.includes(t));
     
     if (matchingTags.length > 0) {
       score += matchingTags.length * 20;
       reasons.push(`Matching tags: ${matchingTags.join(", ")}`);
     }
 
     // Recency bonus for newer pending posts (within 7 days)
     if (targetPost.published_at) {
       const daysSincePublish = Math.floor(
         (Date.now() - new Date(targetPost.published_at).getTime()) / (1000 * 60 * 60 * 24)
       );
       if (daysSincePublish <= 7) {
         score += 15;
         reasons.push("Recently published");
       }
     }
 
     return { score, reasons };
   }, []);
 
   // Get smart suggestions for a given post
   const getSuggestions = useCallback((
     currentPost: { category: string; tags: string[] },
     options: { 
       limit?: number;
       prioritizePending?: boolean;
       excludeIds?: string[];
     } = {}
   ): SmartLinkSuggestion[] => {
     const { limit = 3, prioritizePending = true, excludeIds = [] } = options;
     
     // Create a virtual source post for matching
     const sourcePost: SmartLinkPost = {
       id: currentPostId || "current",
       title: "",
       slug: "",
       category: currentPost.category,
       tags: currentPost.tags,
       indexing_status: "indexed",
     };
 
     // Filter and score posts
     const candidates = allPosts
       .filter(p => p.id !== currentPostId && !excludeIds.includes(p.id))
       .map(post => {
         const { score, reasons } = calculateRelevance(sourcePost, post);
         return {
           post,
           relevanceScore: score,
           matchReason: reasons,
         };
       })
       .filter(s => s.relevanceScore > 0);
 
     // Sort by: pending first (if prioritized), then by relevance score
     candidates.sort((a, b) => {
       if (prioritizePending) {
         const aPending = a.post.indexing_status === "pending" ? 1 : 0;
         const bPending = b.post.indexing_status === "pending" ? 1 : 0;
         if (aPending !== bPending) return bPending - aPending;
       }
       return b.relevanceScore - a.relevanceScore;
     });
 
     return candidates.slice(0, limit);
   }, [allPosts, currentPostId, calculateRelevance]);
 
   // Check if current page is indexed (for smart linking logic)
   const isCurrentPageIndexed = useCallback((postId: string): boolean => {
     const post = allPosts.find(p => p.id === postId);
     return post?.indexing_status === "indexed" || false;
   }, [allPosts]);
 
   // Get suggestions specifically for indexed pages (to promote pending content)
   const getPendingSuggestionsForIndexedPage = useCallback((
     currentPost: { id: string; category: string; tags: string[] },
     limit: number = 3
   ): SmartLinkSuggestion[] => {
     if (!isCurrentPageIndexed(currentPost.id)) {
       return [];
     }
 
     return getSuggestions(
       { category: currentPost.category, tags: currentPost.tags },
       { limit, prioritizePending: true, excludeIds: [currentPost.id] }
     ).filter(s => s.post.indexing_status === "pending");
   }, [getSuggestions, isCurrentPageIndexed]);
 
   // Update indexing status
   const updateIndexingStatus = useCallback(async (
     postId: string,
     status: "indexed" | "pending"
   ): Promise<boolean> => {
     const { error } = await supabase
       .from("blog_posts")
       .update({ indexing_status: status })
       .eq("id", postId);
 
     if (!error) {
       await fetchPosts();
       return true;
     }
     return false;
   }, [fetchPosts]);
 
   // Bulk update indexing status
   const bulkUpdateIndexingStatus = useCallback(async (
     postIds: string[],
     status: "indexed" | "pending"
   ): Promise<boolean> => {
     const { error } = await supabase
       .from("blog_posts")
       .update({ indexing_status: status })
       .in("id", postIds);
 
     if (!error) {
       await fetchPosts();
       return true;
     }
     return false;
   }, [fetchPosts]);
 
   return {
     allPosts,
     indexedPosts,
     pendingPosts,
     isLoading,
     getSuggestions,
     getPendingSuggestionsForIndexedPage,
     isCurrentPageIndexed,
     updateIndexingStatus,
     bulkUpdateIndexingStatus,
     refetch: fetchPosts,
   };
 }