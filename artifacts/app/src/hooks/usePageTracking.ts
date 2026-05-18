import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
};

const BASE = import.meta.env.BASE_URL;

export function usePageTracking(postId?: string) {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch(`${BASE}api/analytics/pageview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_path: location.pathname,
            page_title: document.title,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            session_id: getSessionId(),
            post_id: postId || null,
          }),
        });
      } catch {
        // silent
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
      const linkType = targetUrl.startsWith("/") || targetUrl.includes(window.location.host) ? "internal" : "external";
      await fetch(`${BASE}api/analytics/link-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_url: targetUrl, link_text: linkText, source_post_id: sourcePostId, link_type: linkType }),
      });
    } catch {
      // silent
    }
  }, []);

  return { trackLinkClick };
}
