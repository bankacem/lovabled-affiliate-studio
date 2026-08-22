const DEFAULT_MEASUREMENT_ID = "G-8SDQJ1VPR5";
const measurementId = String(
  import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID,
).trim();

interface GoogleAnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

const googleWindow = window as GoogleAnalyticsWindow;
let loadPromise: Promise<void> | null = null;

export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(measurementId && /^G-[A-Z0-9]+$/i.test(measurementId));
}

export function loadGoogleAnalytics(): Promise<void> {
  if (!isGoogleAnalyticsEnabled()) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    googleWindow.dataLayer = googleWindow.dataLayer || [];
    googleWindow.gtag = googleWindow.gtag || ((...args: unknown[]) => {
      googleWindow.dataLayer?.push(args);
    });

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`,
    );
    if (existingScript) {
      googleWindow.gtag("config", measurementId, { send_page_view: false });
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = () => {
      googleWindow.gtag?.("js", new Date());
      googleWindow.gtag?.("config", measurementId, {
        send_page_view: false,
        cookie_flags: "SameSite=None;Secure",
      });
      resolve();
    };
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function trackGooglePageView(path: string, title: string): void {
  if (!isGoogleAnalyticsEnabled()) return;
  googleWindow.gtag?.("event", "page_view", {
    page_title: title,
    page_location: `${window.location.origin}${path}`,
    page_path: path,
  });
}
