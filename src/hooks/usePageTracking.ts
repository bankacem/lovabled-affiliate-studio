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
          await supabase.rpc("increment_view_count", { post_id: postId });
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

      // Check if link already exists
      const { data: existing } = await supabase
        .from("link_tracking")
        .select("id, click_count")
        .eq("target_url", targetUrl)
        .eq("source_post_id", sourcePostId || "")
        .maybeSingle();

      if (existing) {
        // Update click count
        await supabase
          .from("link_tracking")
          .update({ 
            click_count: existing.click_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      } else {
        // Insert new tracking record
        await supabase.from("link_tracking").insert({
          source_post_id: sourcePostId || null,
          target_url: targetUrl,
          link_text: linkText,
          link_type: linkType,
          click_count: 1,
        });
      }
    } catch (error) {
      console.error("Failed to track link click:", error);
    }
  }, []);

  return { trackLinkClick };
}
