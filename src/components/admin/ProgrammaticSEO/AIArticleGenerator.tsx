import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Trash2,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Save,
  X,
  Pen,
  Table2,
  MessageSquare,
  GraduationCap,
  Megaphone,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { format, addMinutes, addHours, addDays } from "date-fns";

type WritingStyle = "professional" | "friendly" | "conversational" | "academic" | "persuasive" | "storytelling";

const WRITING_STYLES: { value: WritingStyle; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "professional", label: "Professional", icon: <Pen className="h-4 w-4" />, description: "Formal, authoritative tone" },
  { value: "friendly", label: "Friendly", icon: <MessageSquare className="h-4 w-4" />, description: "Warm, approachable style" },
  { value: "conversational", label: "Conversational", icon: <MessageSquare className="h-4 w-4" />, description: "Casual, engaging chat" },
  { value: "academic", label: "Academic", icon: <GraduationCap className="h-4 w-4" />, description: "Scholarly, research-based" },
  { value: "persuasive", label: "Persuasive", icon: <Megaphone className="h-4 w-4" />, description: "Compelling, action-oriented" },
  { value: "storytelling", label: "Storytelling", icon: <BookOpen className="h-4 w-4" />, description: "Narrative, engaging stories" },
];

const STORAGE_KEY = "ai_generated_articles";

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
  generatedAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ArticleStats {
  totalGenerated: number;
  totalSaved: number;
  totalPublished: number;
  totalScheduled: number;
  totalDraft: number;
}

export function AIArticleGenerator() {
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("General");
  const [categories, setCategories] = useState<Category[]>([]);
  const [language, setLanguage] = useState("en");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFAQ, setIncludeFAQ] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeComparisonTable, setIncludeComparisonTable] = useState(false);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>("professional");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [generatedArticles, setGeneratedArticles] = useState<GeneratedArticle[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<ArticleStats>({
    totalGenerated: 0,
    totalSaved: 0,
    totalPublished: 0,
    totalScheduled: 0,
    totalDraft: 0,
  });
  
  // Preview dialog
  const [previewArticle, setPreviewArticle] = useState<GeneratedArticle | null>(null);
  
  // Scheduling options
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "draft" | "scheduled">("draft");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [intervalValue, setIntervalValue] = useState(2);
  const [intervalUnit, setIntervalUnit] = useState<"minutes" | "hours" | "days">("hours");

  useEffect(() => {
    fetchCategories();
    loadFromStorage();
    fetchStats();
  }, []);

  // Save to localStorage whenever generatedArticles changes
  useEffect(() => {
    if (generatedArticles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedArticles));
    }
  }, [generatedArticles]);

  const loadFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const articles = JSON.parse(stored);
        setGeneratedArticles(articles);
        // Auto-select generated articles
        const indices = new Set(articles.map((_: any, i: number) => i).filter((i: number) => articles[i].status === "generated"));
        setSelectedArticles(indices as Set<number>);
      } catch (e) {
        console.error("Failed to load from storage:", e);
      }
    }
  };

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGeneratedArticles([]);
    setSelectedArticles(new Set());
    toast.success("Cleared all generated articles");
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("blog_categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from("blog_posts").select("status, source");
    if (data) {
      const aiGenerated = data.filter(p => p.source === "ai_generated");
      setStats({
        totalGenerated: generatedArticles.length,
        totalSaved: aiGenerated.length,
        totalPublished: aiGenerated.filter(p => p.status === "published").length,
        totalScheduled: aiGenerated.filter(p => p.status === "scheduled").length,
        totalDraft: aiGenerated.filter(p => p.status === "draft").length,
      });
    }
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
          includeComparisonTable,
          writingStyle,
        },
      });

      if (error) throw error;
      
      return {
        ...data,
        status: "generated" as const,
        generatedAt: new Date().toISOString(),
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
        generatedAt: new Date().toISOString(),
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

    // Keep existing articles and add new ones
    const existingArticles = [...generatedArticles];
    const articles: GeneratedArticle[] = [...existingArticles];
    
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
        setSelectedArticles(prev => new Set([...prev, existingArticles.length + i]));
      }
      
      setProgress(((i + 1) / keywordList.length) * 100);
      
      // Add delay between requests to avoid rate limiting
      if (i < keywordList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    setCurrentKeyword("");
    setKeywords(""); // Clear input after generation
    const successCount = articles.filter(a => a.status === "generated").length - existingArticles.filter(a => a.status === "generated").length;
    toast.success(`Generated ${successCount} new articles`);
    fetchStats();
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
    fetchStats();
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

  const deleteArticle = (index: number) => {
    const newArticles = generatedArticles.filter((_, i) => i !== index);
    setGeneratedArticles(newArticles);
    const newSelected = new Set<number>();
    selectedArticles.forEach(i => {
      if (i < index) newSelected.add(i);
      else if (i > index) newSelected.add(i - 1);
    });
    setSelectedArticles(newSelected);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newArticles));
  };

  const deleteSelected = () => {
    const newArticles = generatedArticles.filter((_, i) => !selectedArticles.has(i));
    setGeneratedArticles(newArticles);
    setSelectedArticles(new Set());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newArticles));
    toast.success(`Deleted ${selectedArticles.size} articles`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Article Generator
          </h2>
          <p className="text-muted-foreground">
            Generate professional SEO-optimized articles using AI
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{generatedArticles.filter(a => a.status === "generated").length} Ready</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{stats.totalPublished} Published</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{stats.totalScheduled} Scheduled</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">{stats.totalDraft} Drafts</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Article Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Keywords (one per line)
              </Label>
              <Textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Bitcoin price prediction 2026&#10;Best crypto wallets&#10;Ethereum vs Bitcoin"
                className="min-h-[120px] font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {parseKeywords().length} keywords detected
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9">
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
                <Label className="text-sm">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-9">
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

            {/* Writing Style Selector */}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm flex items-center gap-2">
                <Pen className="h-4 w-4" />
                Writing Style
              </Label>
              <Select value={writingStyle} onValueChange={(v: WritingStyle) => setWritingStyle(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WRITING_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex items-center gap-2">
                        {style.icon}
                        <div>
                          <span className="font-medium">{style.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{style.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a tone that matches your audience
              </p>
            </div>

            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm text-muted-foreground">Content Options</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Table of Contents</span>
                  <Switch checked={includeTOC} onCheckedChange={setIncludeTOC} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">FAQ Section</span>
                  <Switch checked={includeFAQ} onCheckedChange={setIncludeFAQ} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Image Placeholders</span>
                  <Switch checked={includeImages} onCheckedChange={setIncludeImages} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Comparison Table</span>
                  </div>
                  <Switch checked={includeComparisonTable} onCheckedChange={setIncludeComparisonTable} />
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {currentKeyword}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || parseKeywords().length === 0}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
              {isGenerating && (
                <Button variant="outline" size="lg" onClick={() => setIsPaused(true)}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Panel - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Save & Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Save Mode</Label>
              <Select value={scheduleMode} onValueChange={(v: any) => setScheduleMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Save as Draft
                    </div>
                  </SelectItem>
                  <SelectItem value="immediate">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Publish Immediately
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Schedule Publishing
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleMode === "scheduled" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Interval Between Posts</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={intervalValue}
                      onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                      className="w-20 h-9"
                    />
                    <Select value={intervalUnit} onValueChange={(v: any) => setIntervalUnit(v)}>
                      <SelectTrigger className="flex-1 h-9">
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
                    {Array.from(selectedArticles).slice(0, 4).map((index, i) => {
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
                          <span>#{i + 1}: {format(publishAt, "MMM d, HH:mm")}</span>
                        </div>
                      );
                    })}
                    {selectedArticles.size > 4 && (
                      <p className="text-xs text-muted-foreground">...+{selectedArticles.size - 4} more</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedArticles.size} selected</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
                    None
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSaveArticles}
                disabled={selectedArticles.size === 0}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Save {selectedArticles.size} Articles
              </Button>

              {selectedArticles.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={deleteSelected}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Generated Articles Panel - Takes 1 column */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Generated ({generatedArticles.length})
              </CardTitle>
              {generatedArticles.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearStorage} className="h-7 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedArticles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No articles generated yet</p>
                <p className="text-xs mt-1">Enter keywords and click Generate</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-2">
                  {generatedArticles.map((article, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                        selectedArticles.has(index) ? "bg-primary/5 border-primary/30" : "bg-background"
                      }`}
                      onClick={() => article.status !== "error" && toggleArticleSelection(index)}
                    >
                      <Checkbox
                        checked={selectedArticles.has(index)}
                        onCheckedChange={() => toggleArticleSelection(index)}
                        disabled={article.status === "error"}
                        className="mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-medium text-sm line-clamp-1 flex-1">{article.title}</h4>
                          <Badge
                            variant={
                              article.status === "generated" ? "outline" :
                              article.status === "saved" ? "default" : "destructive"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {article.status === "generated" ? "Ready" :
                             article.status === "saved" ? "Saved" : "Error"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {article.excerpt || article.error || "No excerpt"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewArticle(article);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArticle(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewArticle?.title}</DialogTitle>
            <DialogDescription>
              /{previewArticle?.slug} • {previewArticle?.category}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Meta Title</Label>
                <p className="text-sm">{previewArticle?.meta_title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Meta Description</Label>
                <p className="text-sm">{previewArticle?.meta_description}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Excerpt</Label>
              <p className="text-sm">{previewArticle?.excerpt}</p>
            </div>
            <div className="border-t pt-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Content Preview</Label>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: previewArticle?.content || "" }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
