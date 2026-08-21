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

// These are the only lazy components currently mounted by AdminDashboard.
// Legacy article tools remain in the repository for a later Git/PR migration,
// but are intentionally not included in the active bundle until migrated.
export const LazyLinkAnalyticsPanel = lazyWithLoading(
  () => import("./LinkAnalyticsPanel").then((m) => ({ default: m.LinkAnalyticsPanel }))
);

export const LazyDesignEditor = lazyWithLoading(
  () => import("./DesignEditor").then((m) => ({ default: m.DesignEditor }))
);

export const LazyCustomImport = lazyWithLoading(
  () => import("./CustomImport").then((m) => ({ default: m.CustomImport }))
);

export const LazyAIArticleGenerator = lazyWithLoading(
  () => import("./ProgrammaticSEO/AIArticleGenerator").then((m) => ({ default: m.AIArticleGenerator }))
);
