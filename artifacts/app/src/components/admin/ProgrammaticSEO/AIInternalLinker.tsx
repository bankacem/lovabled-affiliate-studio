import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Loader2, Copy, ExternalLink } from "lucide-react";

interface InternalLink {
  target_article_id: string;
  target_title: string;
  url: string;
  anchor_text: string;
  placement: string;
  link_type: "informational" | "commercial";
  relevance_score: number;
}

interface LinkingResult {
  internal_links: InternalLink[];
  linking_strategy: string;
}

export function AIInternalLinker() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [result, setResult] = useState<LinkingResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsFetching(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, excerpt")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(200);

    if (data) setArticles(data);
    setIsFetching(false);
  };

  const generateLinks = async () => {
    const currentArticle = articles.find((a) => a.id === selectedArticleId);
    if (!currentArticle) {
      toast({ title: "Error", description: "Select an article first", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const otherArticles = articles.filter((a) => a.id !== selectedArticleId);
      const { data, error } = await supabase.functions.invoke("ai-internal-linking", {
        body: { currentArticle, existingArticles: otherArticles },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as LinkingResult);
      toast({ title: "Links Generated", description: "Internal linking suggestions ready." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate links", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (link: InternalLink) => {
    const html = `<a href="${link.url}">${link.anchor_text}</a>`;
    navigator.clipboard.writeText(html);
    toast({ title: "Copied", description: "HTML link copied to clipboard" });
  };

  const copyAllLinks = () => {
    if (!result?.internal_links) return;
    const text = result.internal_links
      .map((l) => `[${l.anchor_text}](${l.url}) — ${l.placement}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "All links copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            AI Internal Linking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select an article to generate intelligent internal link suggestions that build topical authority.
          </p>
          <div className="flex gap-3">
            <Select value={selectedArticleId} onValueChange={setSelectedArticleId} disabled={isFetching}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isFetching ? "Loading articles..." : "Select an article..."} />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateLinks} disabled={isLoading || !selectedArticleId}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
              {isLoading ? "Generating..." : "Generate Links"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Strategy */}
          {result.linking_strategy && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-1">Linking Strategy</p>
                <p className="text-sm text-muted-foreground">{result.linking_strategy}</p>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Suggested Links ({result.internal_links?.length || 0})</CardTitle>
                <Button variant="outline" size="sm" onClick={copyAllLinks}>
                  <Copy className="h-3 w-3 mr-1" /> Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.internal_links?.map((link, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={link.link_type === "commercial" ? "default" : "secondary"}>
                          {link.link_type}
                        </Badge>
                        <span className="font-medium text-sm">{link.target_title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round((link.relevance_score || 0) * 100)}% match
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(link)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{link.url}</code>
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Anchor:</span> "{link.anchor_text}"
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Placement:</span> {link.placement}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
