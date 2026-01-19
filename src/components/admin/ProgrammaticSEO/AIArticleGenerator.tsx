import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Calendar,
  Clock,
  Languages,
  ListChecks,
  HelpCircle,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import { format, addMinutes, addHours, addDays } from "date-fns";

interface GeneratedArticle {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  category: string;
  status: "generated" | "saved" | "error";
  error?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AIArticleGenerator() {
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("General");
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("en");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [generatedArticles, setGeneratedArticles] = useState<GeneratedArticle[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  
  // Scheduling options
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "draft" | "scheduled">("draft");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [intervalValue, setIntervalValue] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState<"minutes" | "hours" | "days">("hours");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("blog_categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const parseKeywords = () => {
    return keywords
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  };

  const generateSingleArticle = async (keyword: string): Promise<GeneratedArticle> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: {
          keyword,
          category,
          language,
          includeImages,
          includeFAQ,
          includeTOC,
        },
      });

      if (error) throw error;
      
      return {
        ...data,
        status: "generated" as const,
      };
    } catch (error) {
      console.error("Error generating article:", error);
      return {
        title: keyword,
        slug: "",
        content: "",
        excerpt: "",
        meta_title: "",
        meta_description: "",
        category,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Failed to generate",
      };
    }
  };

  const handleGenerate = async () => {
    const keywordList = parseKeywords();
    if (keywordList.length === 0) {
      toast.error("Please enter at least one keyword");
      return;
    }

    setIsGenerating(true);
    setIsPaused(false);
    setProgress(0);
    setGeneratedArticles([]);
    setSelectedArticles(new Set());

    const articles: GeneratedArticle[] = [];
    
    for (let i = 0; i < keywordList.length; i++) {
      if (isPaused) {
        toast.info("Generation paused");
        break;
      }

      const keyword = keywordList[i];
      setCurrentKeyword(keyword);
      
      const article = await generateSingleArticle(keyword);
      articles.push(article);
      setGeneratedArticles([...articles]);
      
      if (article.status === "generated") {
        setSelectedArticles(prev => new Set([...prev, i]));
      }
      
      setProgress(((i + 1) / keywordList.length) * 100);
      
      // Add delay between requests to avoid rate limiting
      if (i < keywordList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    setCurrentKeyword("");
    toast.success(`Generated ${articles.filter(a => a.status === "generated").length} articles`);
  };

  const handleSaveArticles = async () => {
    const articlesToSave = generatedArticles.filter((_, i) => selectedArticles.has(i) && generatedArticles[i].status === "generated");
    
    if (articlesToSave.length === 0) {
      toast.error("No articles selected");
      return;
    }

    const startDateTime = new Date(startDate);
    let savedCount = 0;

    for (let i = 0; i < articlesToSave.length; i++) {
      const article = articlesToSave[i];
      
      let publishAt: Date | null = null;
      let status = "draft";

      if (scheduleMode === "immediate") {
        status = "published";
        publishAt = new Date();
      } else if (scheduleMode === "scheduled") {
        status = "scheduled";
        switch (intervalUnit) {
          case "minutes":
            publishAt = addMinutes(startDateTime, i * intervalValue);
            break;
          case "hours":
            publishAt = addHours(startDateTime, i * intervalValue);
            break;
          case "days":
            publishAt = addDays(startDateTime, i * intervalValue);
            break;
        }
      }

      const { error } = await supabase.from("blog_posts").insert({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        category: article.category,
        status,
        source: "ai_generated",
        author_name: "AI Writer",
        published_at: status === "published" ? publishAt?.toISOString() : null,
        scheduled_publish_at: status === "scheduled" ? publishAt?.toISOString() : null,
        tags: [],
      });

      if (!error) {
        savedCount++;
        const articleIndex = generatedArticles.findIndex(a => a.slug === article.slug);
        if (articleIndex !== -1) {
          generatedArticles[articleIndex].status = "saved" as any;
          setGeneratedArticles([...generatedArticles]);
        }
      }
    }

    toast.success(`Saved ${savedCount} articles as ${scheduleMode === "immediate" ? "published" : scheduleMode}`);
  };

  const toggleArticleSelection = (index: number) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedArticles(newSelected);
  };

  const selectAll = () => {
    const allIndices = new Set(generatedArticles.map((_, i) => i).filter(i => generatedArticles[i].status === "generated"));
    setSelectedArticles(allIndices);
  };

  const deselectAll = () => {
    setSelectedArticles(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Article Generator
        </h2>
        <p className="text-muted-foreground">
          Generate professional SEO-optimized articles using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Article Settings</CardTitle>
            <CardDescription>Configure your article generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Keywords (one per line)
              </Label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Bitcoin price prediction 2026&#10;Best crypto wallets&#10;Ethereum vs Bitcoin"
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {parseKeywords().length} keywords detected
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Content Options</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={includeTOC} onCheckedChange={setIncludeTOC} />
                  <span className="text-sm">Table of Contents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={includeFAQ} onCheckedChange={setIncludeFAQ} />
                  <span className="text-sm flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    FAQ Section
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={includeImages} onCheckedChange={setIncludeImages} />
                  <span className="text-sm flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Image Placeholders
                  </span>
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating: {currentKeyword}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || parseKeywords().length === 0}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Articles
                  </>
                )}
              </Button>
              {isGenerating && (
                <Button variant="outline" onClick={() => setIsPaused(true)}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Save & Schedule
            </CardTitle>
            <CardDescription>Choose how to save generated articles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Save Mode</Label>
              <Select value={scheduleMode} onValueChange={(v: any) => setScheduleMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save as Draft</SelectItem>
                  <SelectItem value="immediate">Publish Immediately</SelectItem>
                  <SelectItem value="scheduled">Schedule Publishing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleMode === "scheduled" && (
              <>
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Interval Between Posts</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={intervalValue}
                      onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Select value={intervalUnit} onValueChange={(v: any) => setIntervalUnit(v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedArticles.size > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium">Schedule Preview:</p>
                    {Array.from(selectedArticles).slice(0, 5).map((index, i) => {
                      let publishAt: Date;
                      const startDateTime = new Date(startDate);
                      switch (intervalUnit) {
                        case "minutes":
                          publishAt = addMinutes(startDateTime, i * intervalValue);
                          break;
                        case "hours":
                          publishAt = addHours(startDateTime, i * intervalValue);
                          break;
                        case "days":
                          publishAt = addDays(startDateTime, i * intervalValue);
                          break;
                      }
                      return (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Article {i + 1}: {format(publishAt, "MMM d, yyyy HH:mm")}</span>
                        </div>
                      );
                    })}
                    {selectedArticles.size > 5 && (
                      <p className="text-xs text-muted-foreground">...and {selectedArticles.size - 5} more</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                {selectedArticles.size} articles selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Clear
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveArticles}
              disabled={selectedArticles.size === 0}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save {selectedArticles.size} Articles
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Articles List */}
      {generatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Articles ({generatedArticles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {generatedArticles.map((article, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      selectedArticles.has(index) ? "bg-primary/5 border-primary/30" : "bg-background"
                    }`}
                  >
                    <Checkbox
                      checked={selectedArticles.has(index)}
                      onCheckedChange={() => toggleArticleSelection(index)}
                      disabled={article.status === "error"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">{article.title}</h4>
                        <Badge
                          variant={
                            article.status === "generated" ? "outline" :
                            article.status === "saved" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {article.status === "generated" ? "Ready" :
                           article.status === "saved" ? "Saved" : "Error"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {article.excerpt || article.error || "No excerpt"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /{article.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
