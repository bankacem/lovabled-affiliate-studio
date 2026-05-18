import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, TrendingDown, Zap, Rocket, Loader2, RefreshCw, Eye, MousePointer } from "lucide-react";

interface Winner {
  id: string;
  title: string;
  reason: string;
  views: number;
  clicks: number;
  ctr: string;
}

interface Loser {
  id: string;
  title: string;
  reason: string;
  views: number;
  clicks: number;
  ctr: string;
  suggestions: {
    update_strategy: string;
    internal_linking: string;
    content_expansion: string;
  };
}

interface ActionItem {
  article_id: string;
  action: string;
  expected_impact: string;
}

interface AnalyticsResult {
  winners: Winner[];
  losers: Loser[];
  actions: {
    quick_wins: ActionItem[];
    high_roi: ActionItem[];
  };
  overall_insights: string;
}

export function SEOAnalyticsEngine() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, view_count, clicks, impressions, keywords, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setArticles(data);
    }
    setIsFetching(false);
  };

  const analyze = async () => {
    if (articles.length === 0) {
      toast({ title: "No articles", description: "No published articles found to analyze.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("seo-analytics", {
        body: { articles },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalyticsResult);
      toast({ title: "Analysis Complete", description: "SEO performance analysis ready." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Analysis failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              SEO Analytics Engine
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchArticles} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={analyze} disabled={isLoading || isFetching || articles.length === 0}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                {isLoading ? "Analyzing..." : `Analyze ${articles.length} Articles`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI-powered analysis of your article performance. Identifies winners, losers, and actionable improvements.
          </p>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Overall Insights */}
          {result.overall_insights && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm">{result.overall_insights}</p>
              </CardContent>
            </Card>
          )}

          {/* Winners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Winners ({result.winners?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.winners?.map((w, i) => (
                  <div key={i} className="flex items-start justify-between border rounded-lg p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{w.title}</p>
                      <p className="text-xs text-muted-foreground">{w.reason}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs"><Eye className="h-3 w-3 mr-1" />{w.views}</Badge>
                      <Badge variant="outline" className="text-xs"><MousePointer className="h-3 w-3 mr-1" />{w.clicks}</Badge>
                      <Badge className="text-xs bg-green-500/10 text-green-600">{w.ctr}</Badge>
                    </div>
                  </div>
                ))}
                {(!result.winners || result.winners.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">No clear winners identified.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Losers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Need Improvement ({result.losers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {result.losers?.map((l, i) => (
                  <AccordionItem key={i} value={`loser-${i}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">{l.title}</span>
                        <Badge variant="destructive" className="text-xs">{l.ctr}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{l.reason}</p>
                      <div className="grid gap-3">
                        <div className="border rounded p-2">
                          <p className="font-semibold text-xs mb-1">📝 Update Strategy</p>
                          <p className="text-xs text-muted-foreground">{l.suggestions?.update_strategy}</p>
                        </div>
                        <div className="border rounded p-2">
                          <p className="font-semibold text-xs mb-1">🔗 Internal Linking</p>
                          <p className="text-xs text-muted-foreground">{l.suggestions?.internal_linking}</p>
                        </div>
                        <div className="border rounded p-2">
                          <p className="font-semibold text-xs mb-1">📈 Content Expansion</p>
                          <p className="text-xs text-muted-foreground">{l.suggestions?.content_expansion}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.actions?.quick_wins?.map((a, i) => (
                    <div key={i} className="border rounded p-2 space-y-1">
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-xs text-muted-foreground">Impact: {a.expected_impact}</p>
                    </div>
                  ))}
                  {(!result.actions?.quick_wins || result.actions.quick_wins.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">None identified.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  High ROI Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.actions?.high_roi?.map((a, i) => (
                    <div key={i} className="border rounded p-2 space-y-1">
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-xs text-muted-foreground">Impact: {a.expected_impact}</p>
                    </div>
                  ))}
                  {(!result.actions?.high_roi || result.actions.high_roi.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">None identified.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
