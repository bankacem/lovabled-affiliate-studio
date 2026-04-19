import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Module-level variable to track the last GA4 path hit to prevent duplicates
let lastGA4Path: string | null = null;

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
        // Trigger GA4 page view tracking
        if (typeof window.gtag === "function" && lastGA4Path !== location.pathname) {
          window.gtag("config", "G-8SDQJ1VPR5", {
            page_path: location.pathname,
            page_title: document.title,
          });
          lastGA4Path = location.pathname;
        }

        // Insert page view record in Supabase
        await supabase.from("page_views").insert({
          page_path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          post_id: postId || null,
        });

        // FIXED: Use RPC for atomic increment — prevents race condition
        // Run: CREATE OR REPLACE FUNCTION increment_view_count(post_id uuid)
        //      RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
        //        UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1
        //        WHERE id = post_id AND status = 'published';
        //      $$;
        if (postId) {
          const { error } = await supabase.rpc("increment_view_count", {
            post_id: postId,
          });
          // Fallback: if RPC not yet created, use direct update
          if (error && error.message.includes("does not exist")) {
            const { data: currentPost } = await supabase
              .from("blog_posts")
              .select("view_count")
              .eq("id", postId)
              .single();
            await supabase
              .from("blog_posts")
              .update({ view_count: (currentPost?.view_count || 0) + 1 })
              .eq("id", postId);
          }
        }
      } catch {
        // Silently fail — tracking should never break the page
      }
    };

    trackPageView();
  }, [location.pathname, postId]);
}

export function useLinkTracking() {
  const trackLinkClick = useCallback(
    async (targetUrl: string, linkText: string, sourcePostId?: string) => {
      try {
        const linkType =
          targetUrl.startsWith("/") || targetUrl.includes(window.location.host)
            ? "internal"
            : "external";

        let query = supabase
          .from("link_tracking")
          .select("id, click_count")
          .eq("target_url", targetUrl);

        if (sourcePostId) {
          query = query.eq("source_post_id", sourcePostId);
        } else {
          query = query.is("source_post_id", null);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          await supabase
            .from("link_tracking")
            .update({
              click_count: existing.click_count + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("link_tracking").insert({
            source_post_id: sourcePostId || null,
            target_url: targetUrl,
            link_text: linkText,
            link_type: linkType,
            click_count: 1,
          });
        }
      } catch {
        // Silently fail — tracking should never break the page
      }
    },
    []
  );

  return { trackLinkClick };
}