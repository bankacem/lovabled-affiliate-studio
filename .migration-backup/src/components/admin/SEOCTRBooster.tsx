import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Target,
  Loader2,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TitleSuggestion {
  title: string;
  hook: string;
  charCount: number;
}

interface SEOCTRBoosterProps {
  postId: string;
  currentTitle: string;
  keyword?: string;
  category?: string;
  onTitleUpdated?: (newTitle: string) => void;
}

export function SEOCTRBooster({
  postId,
  currentTitle,
  keyword,
  category,
  onTitleUpdated,
}: SEOCTRBoosterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractKeyword = (title: string): string => {
    // Extract the main keyword from the title (first meaningful phrase)
    const cleanTitle = title.replace(/^\d+\s*[-:.]?\s*/, ""); // Remove leading numbers
    const words = cleanTitle.split(/\s+/).slice(0, 5).join(" ");
    return words.toLowerCase();
  };

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const mainKeyword = keyword || extractKeyword(currentTitle);

      const response = await supabase.functions.invoke("optimize-title", {
        body: {
          keyword: mainKeyword,
          currentTitle,
          category,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate suggestions");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.titles && Array.isArray(response.data.titles)) {
        setSuggestions(response.data.titles);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
      toast.error("Failed to generate title suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    generateSuggestions();
  };

  const copyToClipboard = async (title: string, index: number) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedIndex(index);
      toast.success("Title copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const applyTitle = async (title: string, index: number) => {
    setApplyingIndex(index);

    try {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({
          title,
          meta_title: title.slice(0, 60),
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (updateError) throw updateError;

      toast.success("Title updated successfully!");
      onTitleUpdated?.(title);
      setIsOpen(false);
    } catch (err) {
      console.error("Error updating title:", err);
      toast.error("Failed to update title");
    } finally {
      setApplyingIndex(null);
    }
  };

  const getHookIcon = (hook: string) => {
    switch (hook) {
      case "number":
        return <Target className="h-3 w-3" />;
      case "how-to":
        return <Zap className="h-3 w-3" />;
      case "year":
        return <TrendingUp className="h-3 w-3" />;
      case "curiosity":
        return <Sparkles className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getHookLabel = (hook: string) => {
    const labels: Record<string, string> = {
      number: "Numbers",
      "how-to": "How-To",
      year: "Fresh 2026",
      curiosity: "Curiosity",
      "power-word": "Power Words",
      "quick-results": "Quick Results",
    };
    return labels[hook] || hook;
  };

  const getCharCountColor = (count: number) => {
    if (count >= 50 && count <= 60) return "text-green-600 dark:text-green-400";
    if (count >= 45 && count <= 65) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Optimize</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              SEO CTR Booster
            </DialogTitle>
            <DialogDescription>
              AI-powered title optimization for better click-through rates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Title */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Current Title</p>
              <p className="font-medium text-foreground">{currentTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentTitle.length} characters
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                <p className="text-muted-foreground">Generating optimized titles...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="py-8 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={generateSuggestions} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Suggestions */}
            {!isLoading && !error && suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Optimized Suggestions
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSuggestions}
                    className="h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Regenerate
                  </Button>
                </div>

                <AnimatePresence mode="popLayout">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={`${suggestion.title}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 bg-card border rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground leading-snug">
                            {suggestion.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className="text-xs gap-1"
                            >
                              {getHookIcon(suggestion.hook)}
                              {getHookLabel(suggestion.hook)}
                            </Badge>
                            <span
                              className={`text-xs font-medium ${getCharCountColor(
                                suggestion.charCount
                              )}`}
                            >
                              {suggestion.charCount} chars
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(suggestion.title, index)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => applyTitle(suggestion.title, index)}
                            disabled={applyingIndex !== null}
                            className="h-8"
                          >
                            {applyingIndex === index ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Tips */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-primary font-medium mb-1">💡 Pro Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Titles with 50-60 characters display fully in Google results</li>
                <li>• Keywords at the beginning rank better in search</li>
                <li>• Year (2026) signals freshness and boosts CTR</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
