import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSEOSlug, applyAutoLinksToContent, extractLinksFromContent } from "@/lib/seoUtils";

const OPTIMIZER_STORAGE_KEY = "article-optimizer-state";

interface OptimizationResult {
  slugsFixed: number;
  linksAdded: number;
  linksIndexed: number;
  errors: string[];
}

interface OptimizerState {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastResult: OptimizationResult | null;
  startedAt: number | null;
}

export function ArticleOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);
  const abortRef = useRef(false);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(OPTIMIZER_STORAGE_KEY);
    if (savedState) {
      try {
        const state: OptimizerState = JSON.parse(savedState);
        // Only restore if it was running less than 10 minutes ago
        if (state.isRunning && state.startedAt && Date.now() - state.startedAt < 10 * 60 * 1000) {
          // Don't auto-resume, just show that it was interrupted
          setLastResult({
            slugsFixed: 0,
            linksAdded: 0,
            linksIndexed: 0,
            errors: ["Previous optimization was interrupted. Please run again."]
          });
          // Clear the running state
          localStorage.removeItem(OPTIMIZER_STORAGE_KEY);
        } else if (state.lastResult && !state.isRunning) {
          setLastResult(state.lastResult);
        }
      } catch (e) {
        console.error("Failed to load optimizer state:", e);
      }
    }
  }, []);

  // Save state when it changes
  const saveState = useCallback((state: Partial<OptimizerState>) => {
    const currentState = localStorage.getItem(OPTIMIZER_STORAGE_KEY);
    const parsed: OptimizerState = currentState ? JSON.parse(currentState) : {
      isRunning: false,
      progress: 0,
      currentStep: "",
      lastResult: null,
      startedAt: null
    };
    const newState = { ...parsed, ...state };
    localStorage.setItem(OPTIMIZER_STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const optimizeAllArticles = useCallback(async () => {
    abortRef.current = false;
    setIsOptimizing(true);
    setProgress(0);
    setCurrentStep("Loading articles...");
    saveState({ isRunning: true, progress: 0, currentStep: "Loading articles...", startedAt: Date.now() });

    const result: OptimizationResult = {
      slugsFixed: 0,
      linksAdded: 0,
      linksIndexed: 0,
      errors: [],
    };

    try {
      // Step 1: Fetch all posts
      const { data: posts, error: fetchError } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, status")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      if (!posts || posts.length === 0) {
        toast.info("No articles found to optimize");
        return;
      }

      const totalSteps = posts.length * 2 + 2; // slug check + linking + indexing for each
      let completedSteps = 0;

      // Step 2: Build keyword map from all post titles
      setCurrentStep("Building keyword database...");
      const keywordMap = posts.map(post => ({
        keyword: post.title.toLowerCase(),
        targetSlug: post.slug,
        targetTitle: post.title,
        postId: post.id,
      }));

      // Also add 2-3 word phrases from titles
      posts.forEach(post => {
        const words = post.title.split(/\s+/).filter(w => w.length > 3);
        for (let i = 0; i < words.length - 1; i++) {
          keywordMap.push({
            keyword: words.slice(i, i + 2).join(' ').toLowerCase(),
            targetSlug: post.slug,
            targetTitle: post.title,
            postId: post.id,
          });
          if (i < words.length - 2) {
            keywordMap.push({
              keyword: words.slice(i, i + 3).join(' ').toLowerCase(),
              targetSlug: post.slug,
              targetTitle: post.title,
              postId: post.id,
            });
          }
        }
      });

      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);

      // Step 3: Process each post
      for (const post of posts) {
        setCurrentStep(`Optimizing: ${post.title.slice(0, 40)}...`);

        // Fix slug if needed
        const optimizedSlug = generateSEOSlug(post.title);
        let slugUpdated = false;

        if (post.slug !== optimizedSlug) {
          // Check if new slug is available
          const { data: existing } = await supabase
            .from("blog_posts")
            .select("id")
            .eq("slug", optimizedSlug)
            .neq("id", post.id)
            .maybeSingle();

          if (!existing) {
            const { error: slugError } = await supabase
              .from("blog_posts")
              .update({ slug: optimizedSlug })
              .eq("id", post.id);

            if (slugError) {
              result.errors.push(`Slug update failed for "${post.title}": ${slugError.message}`);
            } else {
              result.slugsFixed++;
              slugUpdated = true;
            }
          }
        }

        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);

        // Apply auto-linking if content exists
        if (post.content) {
          const currentSlug = slugUpdated ? optimizedSlug : post.slug;
          const linkedContent = applyAutoLinksToContent(
            post.content,
            keywordMap.filter(k => k.postId !== post.id),
            currentSlug
          );

          // Count new links added
          const originalLinkCount = (post.content.match(/<a\s+[^>]*href/gi) || []).length;
          const newLinkCount = (linkedContent.match(/<a\s+[^>]*href/gi) || []).length;
          const addedLinks = newLinkCount - originalLinkCount;

          if (addedLinks > 0) {
            const { error: contentError } = await supabase
              .from("blog_posts")
              .update({ content: linkedContent })
              .eq("id", post.id);

            if (contentError) {
              result.errors.push(`Content update failed for "${post.title}": ${contentError.message}`);
            } else {
              result.linksAdded += addedLinks;
            }
          }

          // Index all links from this article
          const allLinks = extractLinksFromContent(linkedContent);
          for (const link of allLinks) {
            // Check if link already exists
            const { data: existingLink } = await supabase
              .from("link_tracking")
              .select("id")
              .eq("target_url", link.url)
              .eq("source_post_id", post.id)
              .maybeSingle();

            if (!existingLink) {
              // Insert new link tracking record
              const { error: trackingError } = await supabase
                .from("link_tracking")
                .insert({
                  target_url: link.url,
                  link_text: link.text,
                  link_type: link.isInternal ? "internal" : "external",
                  source_post_id: post.id,
                  click_count: 0,
                });

              if (!trackingError) {
                result.linksIndexed++;
              }
            } else {
              result.linksIndexed++;
            }
          }
        }

        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Step 4: Sync auto_link_keywords table
      setCurrentStep("Updating keyword database...");
      const keywordsToProcess = keywordMap.slice(0, 500); // Limit to prevent overload
      for (const keyword of keywordsToProcess) {
        // Check if keyword already exists
        const { data: existingKeyword } = await supabase
          .from("auto_link_keywords")
          .select("id")
          .eq("keyword", keyword.keyword)
          .eq("target_post_id", keyword.postId)
          .maybeSingle();

        if (!existingKeyword) {
          await supabase
            .from("auto_link_keywords")
            .insert({
              keyword: keyword.keyword,
              target_post_id: keyword.postId,
              priority: keyword.keyword.split(' ').length, // Longer phrases = higher priority
              is_active: true,
            });
        }
      }

      completedSteps++;
      setProgress(100);
      setCurrentStep("Optimization complete!");
      setLastResult(result);
      saveState({ isRunning: false, progress: 100, currentStep: "Optimization complete!", lastResult: result });

      if (result.errors.length === 0) {
        toast.success(
          `Optimized all articles! ${result.slugsFixed} slugs fixed, ${result.linksAdded} links added, ${result.linksIndexed} links indexed.`
        );
      } else {
        toast.warning(
          `Optimization completed with ${result.errors.length} errors. Check details below.`
        );
      }
    } catch (error: any) {
      console.error("Optimization error:", error);
      toast.error("Optimization failed: " + error.message);
      result.errors.push(error.message);
      setLastResult(result);
      saveState({ isRunning: false, lastResult: result });
    } finally {
      setIsOptimizing(false);
    }
  }, [saveState]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Article Optimizer</h3>
              <p className="text-sm text-muted-foreground">
                One-click SEO & internal linking optimization
              </p>
            </div>
          </div>
          <Button
            onClick={optimizeAllArticles}
            disabled={isOptimizing}
            className="gap-2"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Optimize All Articles
              </>
            )}
          </Button>
        </div>

        {isOptimizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {currentStep}
            </p>
          </motion.div>
        )}

        {lastResult && !isOptimizing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{lastResult.slugsFixed}</p>
              <p className="text-xs text-muted-foreground">Slugs Fixed</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Link2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{lastResult.linksAdded}</p>
              <p className="text-xs text-muted-foreground">Links Added</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Sparkles className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{lastResult.linksIndexed}</p>
              <p className="text-xs text-muted-foreground">Links Indexed</p>
            </div>
          </motion.div>
        )}

        {lastResult && lastResult.errors.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {lastResult.errors.length} error(s) occurred
              </span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
              {lastResult.errors.slice(0, 5).map((err, i) => (
                <li key={i} className="truncate">• {err}</li>
              ))}
              {lastResult.errors.length > 5 && (
                <li className="text-muted-foreground/70">
                  ... and {lastResult.errors.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Auto Slug Generation
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Link2 className="h-3 w-3" />
            Smart Internal Linking
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Link Inventory Index
          </Badge>
        </div>
      </div>
    </Card>
  );
}
