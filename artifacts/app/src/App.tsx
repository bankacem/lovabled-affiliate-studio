import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { initApiClient } from "@/lib/api";

initApiClient();

const Index = lazy(() => import("./pages/Index"));
const Designs = lazy(() => import("./pages/Designs"));
const DesignDetail = lazy(() => import("./pages/DesignDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Admin = lazy(() => import("./pages/Admin"));
const Studio = lazy(() => import("./pages/Studio"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LanguageProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Default Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/designs" element={<Designs />} />
                  <Route path="/designs/:id" element={<DesignDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/studio" element={<Studio />} />

                  {/* Multi-language Prefixed Routes */}
                  <Route path="/:lang" element={<Index />} />
                  <Route path="/:lang/designs" element={<Designs />} />
                  <Route path="/:lang/designs/:id" element={<DesignDetail />} />
                  <Route path="/:lang/blog" element={<Blog />} />
                  <Route path="/:lang/blog/:id" element={<BlogPost />} />
                  <Route path="/:lang/about" element={<About />} />
                  <Route path="/:lang/admin" element={<Admin />} />

                  {/* Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </LanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
