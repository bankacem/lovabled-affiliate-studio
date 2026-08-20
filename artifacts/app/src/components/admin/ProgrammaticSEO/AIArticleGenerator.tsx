import { useState, useEffect, useCallback } from "react";
import { invokeAI } from "@/lib/aiApi";
import { saveArticle } from "@/lib/githubContent";
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
  Key,
  Shield,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { format as formatDate, addMinutes, addHours, addDays } from "date-fns";

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
const PENDING_QUEUE_KEY = "ai_pending_keyword_queue";
const today = () => new Date().toISOString().slice(0, 10);

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
  duplicateWarning?: string | null;
  read_time?: string;
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
  const [analyzeCompetitorsFirst, setAnalyzeCompetitorsFirst] = useState(false);
  const [competitorAnalysisStatus, setCompetitorAnalysisStatus] = useState<Record<string, "analyzing" | "done" | "error">>({});
  
  // Multi-model support
  type AIProvider = "lovable" | "bluesminds" | "openrouter" | "groq";
  const [aiProvider, setAiProvider] = useState<AIProvider>("bluesminds");
  const [bluesmindsModel, setBluesmindsModel] = useState("gpt-4o-mini");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState("anthropic/claude-sonnet-4");
  const [delayBetweenArticles, setDelayBetweenArticles] = useState(10);
  const [groqModel, setGroqModel] = useState("llama-3.3-70b-versatile");
  const [customOpenrouterModel, setCustomOpenrouterModel] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  
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
  const [startDate, setStartDate] = useState(formatDate(new Date(), "yyyy-MM-dd'T'HH:mm"));
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
        const articles: GeneratedArticle[] = JSON.parse(stored);
        setGeneratedArticles(articles);
        // Auto-select all articles with status "generated"
        const generatedIndices: number[] = [];
        articles.forEach((article, index) => {
          if (article.status === "generated") {
            generatedIndices.push(index);
          }
        });
        setSelectedArticles(new Set(generatedIndices));
        if (articles.length > 0) {
          toast.info(
            `Restored ${articles.length} article${articles.length === 1 ? "" : "s"} from your previous session (connection loss / page refresh protection).`,
          );
        }
      } catch (e) {
        console.error("Failed to load from storage:", e);
      }
    }

    // Restore any keyword queue left unfinished by an interrupted batch —
    // e.g. the tab was refreshed or the connection dropped mid-generation.
    const pendingRaw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (pendingRaw) {
      try {
        const pending: string[] = JSON.parse(pendingRaw);
        if (pending.length > 0) {
          setKeywords(pending.join("\n"));
          toast.warning(
            `${pending.length} keyword${pending.length === 1 ? "" : "s"} from an interrupted batch ${pending.length === 1 ? "was" : "were"} restored below — press Generate to pick up where you left off.`,
          );
        } else {
          localStorage.removeItem(PENDING_QUEUE_KEY);
        }
      } catch (e) {
        console.error("Failed to load pending queue:", e);
        localStorage.removeItem(PENDING_QUEUE_KEY);
      }
    }
  };

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_QUEUE_KEY);
    setGeneratedArticles([]);
    setSelectedArticles(new Set());
    toast.success("Cleared all generated articles");
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/blog-index.json", { cache: "no-cache" });
      const index = await response.json();
      const names = Array.from(new Set((index.posts || []).map((post: { category?: string }) => post.category).filter(Boolean))).sort();
      setCategories(names.map((name) => { const value = String(name); return { id: value, name: value, slug: value.toLowerCase().replace(/\\s+/g, "-") }; }));
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/blog-index.json", { cache: "no-cache" });
      const index = await response.json();
      const posts = index.posts || [];
      setStats({
        totalGenerated: generatedArticles.length,
        totalSaved: posts.length,
        totalPublished: posts.filter((p: { status?: string }) => p.status === "published").length,
        totalScheduled: posts.filter((p: { status?: string }) => p.status === "scheduled").length,
        totalDraft: posts.filter((p: { status?: string }) => p.status === "draft").length,
      });
    } catch (error) {
      console.error("Failed to load article stats", error);
    }
  };

  const parseKeywords = () => {
    return keywords
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);
  };

  const testConnection = async () => {
    setConnectionStatus("testing");
    try {
      let functionName = "";
      let body: any = { keyword: "test connection", category: "General" };
      if (aiProvider === "openrouter") {
        functionName = "generate-article-openrouter";
        body = { ...body, apiKey: openrouterKey, model: customOpenrouterModel || openrouterModel };
      } else if (aiProvider === "groq") {
        functionName = "generate-article-groq";
        body = { ...body, apiKey: groqKey, model: groqModel };
      } else if (aiProvider === "bluesminds") {
        functionName = "generate-article-bluesminds";
        body = { ...body, model: bluesmindsModel };
      } else {
        functionName = "generate-article";
      }

      const data = await invokeAI(functionName, body);
      if ((data as any)?.error) throw new Error((data as any).error);
      setConnectionStatus("success");
      toast.success("Connection successful! ✅");
    } catch (err) {
      setConnectionStatus("error");
      toast.error("Connection failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const analyzeCompetitors = async (keyword: string): Promise<string | undefined> => {
    setCompetitorAnalysisStatus(prev => ({ ...prev, [keyword]: "analyzing" }));
    try {
      const data = await invokeAI<{ competitorBrief?: string; error?: string }>("analyze-competitors", { keyword });
      if (data?.error) {
        // Not fatal — surface it once and continue generating without a
        // brief rather than blocking the whole batch on a missing API key.
        toast.warning(`Competitor analysis skipped for "${keyword}": ${data.error}`);
        setCompetitorAnalysisStatus(prev => ({ ...prev, [keyword]: "error" }));
        return undefined;
      }
      setCompetitorAnalysisStatus(prev => ({ ...prev, [keyword]: "done" }));
      return data?.competitorBrief as string | undefined;
    } catch (err) {
      console.error("Competitor analysis failed:", err);
      setCompetitorAnalysisStatus(prev => ({ ...prev, [keyword]: "error" }));
      toast.warning(`Competitor analysis failed for "${keyword}", generating without it.`);
      return undefined;
    }
  };

  const callGenerator = async (baseBody: Record<string, unknown>) => {
    let data: any;
    let error: any;

    if (aiProvider === "lovable") {
      data = await invokeAI("generate-article", baseBody);
    } else if (aiProvider === "openrouter") {
      if (!openrouterKey) throw new Error("OpenRouter API key is required");
      data = await invokeAI("generate-article-openrouter", { ...baseBody, apiKey: openrouterKey, model: customOpenrouterModel || openrouterModel });
    } else if (aiProvider === "groq") {
      if (!groqKey) throw new Error("Groq API key is required");
      data = await invokeAI("generate-article-groq", { ...baseBody, apiKey: groqKey, model: groqModel });
    } else if (aiProvider === "bluesminds") {
      data = await invokeAI("generate-article-bluesminds", { ...baseBody, model: bluesmindsModel });
    }

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // The missing "evaluation + correction" step: score the draft (free rule
  // checks + one AI call only if there's a competitor brief to check
  // against), and if it falls short, ask for exactly ONE corrective
  // rewrite with the specific feedback. Deliberately capped at a single
  // retry — no open-ended loop, no extra tools, just one more of the same
  // API call already being used.
  const evaluateAndMaybeRevise = async (data: any, baseBody: Record<string, unknown>, keyword: string) => {
    try {
      const evalData = await invokeAI<any>("evaluate-article", {
        title: data.title,
        content: data.content,
        keyword,
        metaDescription: data.meta_description,
        includeFAQ,
        includeComparisonTable,
        competitorBrief: (baseBody as any).competitorBrief,
      });
      const evalError = null;
      if (evalError || !evalData) return data; // evaluation failing must never block publishing

      if (!evalData.passesThreshold && evalData.revisionFeedback) {
        toast.info(`"${keyword}" needs one revision (score ${evalData.score}/100) — rewriting once with specific feedback…`);
        const revised = await callGenerator({ ...baseBody, revisionFeedback: evalData.revisionFeedback });
        return revised ?? data;
      }
      return data;
    } catch (e) {
      console.error("Evaluation step failed, keeping original draft:", e);
      return data;
    }
  };

  const generateSingleArticle = async (keyword: string): Promise<GeneratedArticle> => {
    try {
      const competitorBrief = analyzeCompetitorsFirst ? await analyzeCompetitors(keyword) : undefined;

      const baseBody = {
        keyword,
        category,
        language,
        includeImages,
        includeFAQ,
        includeTOC,
        includeComparisonTable,
        writingStyle,
        competitorBrief,
      };

      let data = await callGenerator(baseBody);
      data = await evaluateAndMaybeRevise(data, baseBody, keyword);

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
        // Persist whatever hasn't been processed yet so a refresh or lost
        // connection from here doesn't lose the rest of the queue.
        localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(keywordList.slice(i)));
        break;
      }

      const keyword = keywordList[i];
      setCurrentKeyword(keyword);

      // Before each article: persist the keywords still left in the queue
      // (including this one, in case generation itself fails to return —
      // e.g. the connection drops mid-request).
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(keywordList.slice(i)));

      const article = await generateSingleArticle(keyword);
      articles.push(article);
      setGeneratedArticles([...articles]);

      if (article.status === "generated") {
        setSelectedArticles(prev => new Set([...prev, existingArticles.length + i]));
        if (article.duplicateWarning) {
          toast.warning(`"${keyword}": ${article.duplicateWarning}`, { duration: 8000 });
        }
      }

      setProgress(((i + 1) / keywordList.length) * 100);

      // This keyword is done — shrink the persisted queue to what's left.
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(keywordList.slice(i + 1)));

      // Add delay between requests to avoid rate limiting
      if (i < keywordList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenArticles * 1000));
      }
    }

    setIsGenerating(false);
    setCurrentKeyword("");
    setKeywords(""); // Clear input after generation
    localStorage.removeItem(PENDING_QUEUE_KEY); // Batch finished — nothing left to resume
    const successCount = articles.filter(a => a.status === "generated").length - existingArticles.filter(a => a.status === "generated").length;
    toast.success(`Generated ${successCount} new articles`);
    fetchStats();
  };

  const handleSaveArticles = async () => {
    // Get indices of selected articles that have "generated" status
    const selectedIndices = Array.from(selectedArticles);
    const articlesToSave = selectedIndices
      .filter(i => generatedArticles[i] && generatedArticles[i].status === "generated")
      .map(i => ({ article: generatedArticles[i], originalIndex: i }));
    
    if (articlesToSave.length === 0) {
      toast.error("No articles selected for saving. Make sure selected articles have 'generated' status.");
      return;
    }

    const startDateTime = new Date(startDate);
    let savedCount = 0;

    const updatedArticles = [...generatedArticles];
    
    for (let i = 0; i < articlesToSave.length; i++) {
      const { article, originalIndex } = articlesToSave[i];
      
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

      try {
        await saveArticle({
          title: article.title,
          slug: article.slug,
          description: article.excerpt || article.meta_description || "",
          category: article.category || category,
          tags: [],
          author: "AI Writer",
          image: "",
          image_alt: article.title,
          date: publishAt?.toISOString().slice(0, 10) || today(),
          updated: today(),
          status: status as "published" | "draft" | "scheduled",
          scheduled_at: status === "scheduled" ? publishAt?.toISOString() || "" : "",
          read_time: article.read_time || "6 min read",
          content: article.content,
        });
        savedCount++;
        updatedArticles[originalIndex] = { ...updatedArticles[originalIndex], status: "saved" };
      } catch (error) {
        console.error("Error creating article Pull Request:", error);
        toast.error(`Failed to create PR: ${article.title}`);
      }
    }
    
    setGeneratedArticles(updatedArticles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));

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

            {/* AI Model Selector */}
            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Model
              </Label>
              <Select value={aiProvider} onValueChange={(v: AIProvider) => { setAiProvider(v); setConnectionStatus("idle"); }}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Lovable AI (Built-in)
                    </div>
                  </SelectItem>
                  <SelectItem value="bluesminds">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-500" />
                      Bluesminds (Recommended)
                    </div>
                  </SelectItem>
                  <SelectItem value="openrouter">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      OpenRouter
                    </div>
                  </SelectItem>
                  <SelectItem value="groq">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      Groq
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {aiProvider === "bluesminds" && (
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <div className="flex gap-1">
                      <Select value={bluesmindsModel} onValueChange={setBluesmindsModel}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o (Best)</SelectItem>
                          <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={connectionStatus === "testing"}
                        onClick={testConnection}
                      >
                        {connectionStatus === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                         connectionStatus === "success" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                         connectionStatus === "error" ? <X className="h-3 w-3 text-red-500" /> :
                         <Key className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">🔒 Key stored server-side (Api1 secret). Auto-fallback across models. Human-tone SEO output with internal + external links.</p>
                </div>
              )}

              {aiProvider === "openrouter" && (
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <div className="flex gap-1">
                      <Input
                        type="password"
                        value={openrouterKey}
                        onChange={(e) => setOpenrouterKey(e.target.value)}
                        placeholder="sk-or-..."
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={!openrouterKey || connectionStatus === "testing"}
                        onClick={testConnection}
                      >
                        {connectionStatus === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                         connectionStatus === "success" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                         connectionStatus === "error" ? <X className="h-3 w-3 text-red-500" /> :
                         <Key className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Select value={openrouterModel} onValueChange={setOpenrouterModel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4</SelectItem>
                        <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="meta-llama/llama-4-maverick">Llama 4 Maverick</SelectItem>
                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Or custom model ID</Label>
                    <Input
                      value={customOpenrouterModel}
                      onChange={(e) => setCustomOpenrouterModel(e.target.value)}
                      placeholder="e.g. mistralai/mistral-large"
                      className="h-8 text-xs"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">🔒 Key stored in session only — never saved</p>
                </div>
              )}

              {aiProvider === "groq" && (
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <div className="flex gap-1">
                      <Input
                        type="password"
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        placeholder="gsk_..."
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={!groqKey || connectionStatus === "testing"}
                        onClick={testConnection}
                      >
                        {connectionStatus === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                         connectionStatus === "success" ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                         connectionStatus === "error" ? <X className="h-3 w-3 text-red-500" /> :
                         <Key className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Select value={groqModel} onValueChange={setGroqModel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B</SelectItem>
                        <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                        <SelectItem value="gemma2-9b-it">Gemma2 9B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">🔒 Key stored in session only — never saved</p>
                </div>
              )}
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
              <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-sm font-medium">Outrank Competitors</span>
                    <p className="text-xs text-muted-foreground">Searches the top 3 Google results for each keyword, finds their gaps, and writes the article to beat them. Adds a search + fetch step before writing (slightly slower, costs one search per keyword). Requires a SERPER_API_KEY secret.</p>
                  </div>
                </div>
                <Switch checked={analyzeCompetitorsFirst} onCheckedChange={setAnalyzeCompetitorsFirst} />
              </div>
            </div>

            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm text-muted-foreground">Delay Between Articles</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={3}
                  max={120}
                  value={delayBetweenArticles}
                  onChange={(e) => setDelayBetweenArticles(Math.max(3, Number(e.target.value)))}
                  className="h-8 w-20 text-xs"
                />
                <span className="text-xs text-muted-foreground">seconds (min 3s to avoid rate limits)</span>
              </div>
            </div>
            </div>

            {isGenerating && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {currentKeyword}
                    {competitorAnalysisStatus[currentKeyword] === "analyzing" && (
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" /> analyzing top 3 competitors…
                      </Badge>
                    )}
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
                          <span>#{i + 1}: {formatDate(publishAt, "MMM d, HH:mm")}</span>
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
