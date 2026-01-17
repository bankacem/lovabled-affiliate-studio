import { lazy, Suspense, ComponentType } from "react";

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Create a wrapper for lazy components with loading state
function lazyWithLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy load heavy components
export const LazyRichTextEditor = lazyWithLoading(
  () => import("./RichTextEditor").then(m => ({ default: m.RichTextEditor }))
);

export const LazyLinkAnalyticsPanel = lazyWithLoading(
  () => import("./LinkAnalyticsPanel").then(m => ({ default: m.LinkAnalyticsPanel }))
);

export const LazyAnalyticsDashboard = lazyWithLoading(
  () => import("./AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard }))
);

export const LazyBlogPostEditor = lazyWithLoading(
  () => import("./BlogPostEditor").then(m => ({ default: m.BlogPostEditor }))
);

export const LazyBlogToolsPanel = lazyWithLoading(
  () => import("./BlogToolsPanel").then(m => ({ default: m.BlogToolsPanel }))
);

export const LazyBulkPostImport = lazyWithLoading(
  () => import("./BulkPostImport").then(m => ({ default: m.BulkPostImport }))
);

export const LazyDesignEditor = lazyWithLoading(
  () => import("./DesignEditor").then(m => ({ default: m.DesignEditor }))
);

export const LazyCustomImport = lazyWithLoading(
  () => import("./CustomImport").then(m => ({ default: m.CustomImport }))
);
