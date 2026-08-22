import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  loadGoogleAnalytics,
  trackGooglePageView,
} from "@/lib/googleAnalytics";

function isPrivateRoute(pathname: string): boolean {
  return /^\/(?:[a-z]{2}\/)?(?:admin|studio)(?:\/|$)/i.test(pathname);
}

export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (isPrivateRoute(location.pathname)) return;

    let cancelled = false;
    void loadGoogleAnalytics().then(() => {
      if (!cancelled) {
        trackGooglePageView(
          `${location.pathname}${location.search}${location.hash}`,
          document.title,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}
