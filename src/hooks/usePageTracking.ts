import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
};

export function usePageTracking(postId?: string) {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await supabase.from("page_views").insert({
          page_path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          post_id: postId || null,
        });

        // Update view count on blog post if applicable
        if (postId) {
          const { data: post } = await supabase
            .from("blog_posts")
            .select("view_count")
            .eq("id", postId)
            .single();
          
          await supabase
            .from("blog_posts")
            .update({ view_count: (post?.view_count || 0) + 1 })
            .eq("id", postId);
        }
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    trackPageView();
  }, [location.pathname, postId]);
}

export function useLinkTracking() {
  const trackLinkClick = useCallback(async (
    targetUrl: string,
    linkText: string,
    sourcePostId?: string
  ) => {
    try {
      const linkType = targetUrl.startsWith("/") || targetUrl.includes(window.location.host)
        ? "internal"
        : "external";

      // Build proper filter for source_post_id
      let query = supabase
        .from("link_tracking")
        .select("id, click_count")
        .eq("target_url", targetUrl);
      
      // Handle null source_post_id properly
      if (sourcePostId) {
        query = query.eq("source_post_id", sourcePostId);
      } else {
        query = query.is("source_post_id", null);
      }
      
      const { data: existing, error: selectError } = await query.maybeSingle();

      if (selectError) {
        console.error("Error checking existing link:", selectError);
        return;
      }

      if (existing) {
        // Update click count
        const { error: updateError } = await supabase
          .from("link_tracking")
          .update({ 
            click_count: existing.click_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        
        if (updateError) {
          console.error("Error updating link click:", updateError);
        }
      } else {
        // Insert new tracking record
        const { error: insertError } = await supabase.from("link_tracking").insert({
          source_post_id: sourcePostId || null,
          target_url: targetUrl,
          link_text: linkText,
          link_type: linkType,
          click_count: 1,
        });
        
        if (insertError) {
          console.error("Error inserting link tracking:", insertError);
        }
      }
    } catch (error) {
      console.error("Failed to track link click:", error);
    }
  }, []);

  return { trackLinkClick };
}
