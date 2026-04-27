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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket, Play, AlertCircle, CheckCircle2, Loader2, Calendar, Send, FileText, Clock } from "lucide-react";
import { generateSEOSlug } from "@/lib/seoUtils";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface ArticleTemplate {
  id: string;
  name: string;
  template_type: string;
  title_template: string;
  slug_template: string;
  content_template: string;
  excerpt_template: string | null;
  category: string;
  tags: string[];
  meta_title_template: string | null;
  meta_description_template: string | null;
}

interface GenerationBatch {
  id: string;
  batch_name: string;
  template_id: string;
  total_articles: number;
  generated_count: number;
  published_count: number;
  status: string;
  variables_data: Json;
  created_at: string;
}

// Pre-defined variable sets
const YEAR_RANGES = {
  "1950-1970": Array.from({ length: 21 }, (_, i) => 1950 + i),
  "1971-1990": Array.from({ length: 20 }, (_, i) => 1971 + i),
  "1991-2010": Array.from({ length: 20 }, (_, i) => 1991 + i),
  "2011-2026": Array.from({ length: 16 }, (_, i) => 2011 + i),
};

const POPULAR_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "London", "Paris", "Tokyo", "Dubai", "Singapore",
  "Sydney", "Toronto", "Mumbai", "Berlin", "Madrid"
];

const PROFESSIONS = [
  "Engineer", "Doctor", "Teacher", "Developer", "Designer",
  "Nurse", "Lawyer", "Chef", "Photographer", "Artist",
  "Musician", "Writer", "Scientist", "Architect", "Accountant"
];

type PublishAction = "draft" | "publish" | "schedule";

export function ArticleGenerator() {
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [batchName, setBatchName] = useState("");
  const [variablesInput, setVariablesInput] = useState("");
  const [variableType, setVariableType] = useState<"years" | "cities" | "professions" | "custom">("years");
  const [selectedYearRange, setSelectedYearRange] = useState<string>("1991-2010");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Publishing options
  const [publishAction, setPublishAction] = useState<PublishAction>("draft");
  const [scheduleInterval, setScheduleInterval] = useState<number>(60); // minutes
  const [scheduleUnit, setScheduleUnit] = useState<"minutes" | "hours" | "days">("minutes");
  const [startDate, setStartDate] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [templatesRes, batchesRes] = await Promise.all([
      supabase.from("article_templates").select("*").eq("is_active", true),
      supabase.from("generation_batches").select("*").order("created_at", { ascending: false }).limit(10)
    ]);

    if (templatesRes.data) setTemplates(templatesRes.data);
    if (batchesRes.data) setBatches(batchesRes.data);
    
    setIsLoading(false);
  };

  const getVariables = useCallback(() => {
    if (variableType === "years") {
      return YEAR_RANGES[selectedYearRange as keyof typeof YEAR_RANGES].map(year => ({
        year: year.toString(),
        age: (2026 - year).toString()
      }));
    } else if (variableType === "cities") {
      return POPULAR_CITIES.map(city => ({ city: city.toLowerCase().replace(/\s+/g, "-"), City: city }));
    } else if (variableType === "professions") {
      return PROFESSIONS.map(prof => ({ profession: prof.toLowerCase(), Profession: prof }));
    } else {
      try {
        return JSON.parse(variablesInput);
      } catch {
        return [];
      }
    }
  }, [variableType, selectedYearRange, variablesInput]);

  const replaceVariables = (template: string, variables: Record<string, string>) => {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\[${key}\\]`, "gi");
      result = result.replace(regex, value);
    });
    return result;
  };

  const generateSlug = (template: string, variables: Record<string, string>) => {
    const rawSlug = replaceVariables(template, variables);
    let slug = generateSEOSlug(rawSlug);
    
    if (!slug.startsWith("p-")) {
      slug = "p-" + slug;
    }
    
    return slug;
  };

  const getIntervalInMinutes = () => {
    switch (scheduleUnit) {
      case "hours": return scheduleInterval * 60;
      case "days": return scheduleInterval * 60 * 24;
      default: return scheduleInterval;
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const variables = getVariables();
    if (variables.length === 0) {
      toast.error("Please provide variables");
      return;
    }

    const finalBatchName = batchName || `Batch ${new Date().toISOString()}`;
    
    setIsGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    setTotalCount(variables.length);
    setErrors([]);

    // Create batch record
    const { data: batchData, error: batchError } = await supabase
      .from("generation_batches")
      .insert([{
        batch_name: finalBatchName,
        template_id: selectedTemplate,
        total_articles: variables.length,
        status: "generating",
        variables_data: { type: variableType, variables }
      }])
      .select()
      .single();

    if (batchError) {
      toast.error("Failed to create batch");
      setIsGenerating(false);
      return;
    }

    const batchId = batchData.id;
    let successCount = 0;
    const errorMessages: string[] = [];
    const intervalMinutes = getIntervalInMinutes();
    const baseDate = startDate ? new Date(startDate) : new Date();

    // Generate articles in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < variables.length; i += BATCH_SIZE) {
      const chunk = variables.slice(i, Math.min(i + BATCH_SIZE, variables.length));
      
      const articles = chunk.map((vars: Record<string, string>, idx: number) => {
        const globalIdx = i + idx;
        const slug = generateSlug(template.slug_template, vars);
        
        // Calculate status and dates based on publish action
        let status = "generated_draft";
        let publishedAt = null;
        let scheduledPublishAt = null;

        if (publishAction === "publish") {
          status = "published";
          publishedAt = new Date().toISOString();
        } else if (publishAction === "schedule") {
          status = "scheduled";
          const scheduleDate = new Date(baseDate.getTime() + (globalIdx * intervalMinutes * 60 * 1000));
          scheduledPublishAt = scheduleDate.toISOString();
        }
        
        return {
          title: replaceVariables(template.title_template, vars),
          slug: slug,
          content: replaceVariables(template.content_template, vars),
          excerpt: template.excerpt_template ? replaceVariables(template.excerpt_template, vars) : null,
          category: template.category,
          tags: template.tags,
          meta_title: template.meta_title_template ? replaceVariables(template.meta_title_template, vars) : null,
          meta_description: template.meta_description_template ? replaceVariables(template.meta_description_template, vars) : null,
          source: "programmatic",
          template_id: template.id,
          generation_batch: batchId,
          status,
          published_at: publishedAt,
          scheduled_publish_at: scheduledPublishAt,
          author_name: "Content Team",
        };
      });

      // Check for existing slugs
      const slugs = articles.map(a => a.slug);
      const { data: existingSlugs } = await supabase
        .from("blog_posts")
        .select("slug")
        .in("slug", slugs);

      const existingSlugSet = new Set(existingSlugs?.map(s => s.slug) || []);
      const newArticles = articles.filter(a => !existingSlugSet.has(a.slug));
      const skippedCount = articles.length - newArticles.length;

      if (skippedCount > 0) {
        errorMessages.push(`Skipped ${skippedCount} articles due to duplicate slugs`);
      }

      if (newArticles.length > 0) {
        const { error } = await supabase
          .from("blog_posts")
          .insert(newArticles);

        if (error) {
          errorMessages.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
        } else {
          successCount += newArticles.length;
        }
      }

      setGeneratedCount(i + chunk.length);
      setProgress(((i + chunk.length) / variables.length) * 100);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update batch status
    const finalStatus = publishAction === "publish" ? "published" : 
                        publishAction === "schedule" ? "scheduled" :
                        errorMessages.length > 0 ? "completed_with_errors" : "completed";
    
    await supabase
      .from("generation_batches")
      .update({
        generated_count: successCount,
        published_count: publishAction === "publish" ? successCount : 0,
        status: finalStatus
      })
      .eq("id", batchId);

    setErrors(errorMessages);
    setIsGenerating(false);
    
    const actionText = publishAction === "publish" ? "published" : 
                       publishAction === "schedule" ? "scheduled" : "created as drafts";
    
    if (errorMessages.length === 0) {
      toast.success(`Successfully ${actionText} ${successCount} articles!`);
    } else {
      toast.warning(`${successCount} articles ${actionText} with some errors`);
    }

    fetchData();
  };

  const handlePublishBatch = async (batchId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("generation_batch", batchId)
      .eq("status", "generated_draft");

    if (error) {
      toast.error("Failed to publish articles");
    } else {
      toast.success("All batch articles published");
      
      await supabase
        .from("generation_batches")
        .update({ status: "published" })
        .eq("id", batchId);
      
      fetchData();
    }
  };

  const handleScheduleBatch = async (batchId: string) => {
    const intervalMinutes = getIntervalInMinutes();
    const baseDate = startDate ? new Date(startDate) : new Date();

    // Get all draft articles from this batch
    const { data: articles } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("generation_batch", batchId)
      .eq("status", "generated_draft")
      .order("created_at", { ascending: true });

    if (!articles || articles.length === 0) {
      toast.error("No draft articles to schedule");
      return;
    }

    // Update each article with scheduled time
    for (let i = 0; i < articles.length; i++) {
      const scheduleDate = new Date(baseDate.getTime() + (i * intervalMinutes * 60 * 1000));
      await supabase
        .from("blog_posts")
        .update({ 
          status: "scheduled", 
          scheduled_publish_at: scheduleDate.toISOString() 
        })
        .eq("id", articles[i].id);
    }

    await supabase
      .from("generation_batches")
      .update({ status: "scheduled" })
      .eq("id", batchId);

    toast.success(`Scheduled ${articles.length} articles for publishing`);
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Batch Article Generator</h2>
        <p className="text-muted-foreground">Generate programmatic SEO articles at scale</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Generate New Batch
          </CardTitle>
          <CardDescription>
            Select a template and configure variables to generate multiple articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template & Batch Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Birthday Articles 1990-2010"
              />
            </div>
          </div>

          {/* Variable Type */}
          <div className="space-y-2">
            <Label>Variable Type</Label>
            <Select value={variableType} onValueChange={(v: typeof variableType) => setVariableType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Years</SelectItem>
                <SelectItem value="cities">Cities</SelectItem>
                <SelectItem value="professions">Professions</SelectItem>
                <SelectItem value="custom">Custom JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {variableType === "years" && (
            <div className="space-y-2">
              <Label>Year Range</Label>
              <Select value={selectedYearRange} onValueChange={setSelectedYearRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(YEAR_RANGES).map((range) => (
                    <SelectItem key={range} value={range}>
                      {range} ({YEAR_RANGES[range as keyof typeof YEAR_RANGES].length} years)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {variableType === "custom" && (
            <div className="space-y-2">
              <Label>Variables (JSON Array)</Label>
              <Textarea
                value={variablesInput}
                onChange={(e) => setVariablesInput(e.target.value)}
                placeholder='[{"year": "1990", "age": "35"}, {"year": "1991", "age": "34"}]'
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Publishing Options */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">Publishing Options</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  publishAction === "draft" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setPublishAction("draft")}
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Save as Draft</p>
                  <p className="text-xs text-muted-foreground">Review before publishing</p>
                </div>
              </div>
              
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  publishAction === "publish" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setPublishAction("publish")}
              >
                <Send className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Publish Immediately</p>
                  <p className="text-xs text-muted-foreground">Go live instantly</p>
                </div>
              </div>
              
              <div 
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  publishAction === "schedule" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setPublishAction("schedule")}
              >
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Schedule</p>
                  <p className="text-xs text-muted-foreground">Auto-publish over time</p>
                </div>
              </div>
            </div>

            {publishAction === "schedule" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min={1}
                    value={scheduleInterval}
                    onChange={(e) => setScheduleInterval(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={scheduleUnit} onValueChange={(v: typeof scheduleUnit) => setScheduleUnit(v)}>
                    <SelectTrigger>
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
            )}
          </div>

          {/* Summary */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {getVariables().length} articles will be {
                publishAction === "draft" ? "saved as drafts" :
                publishAction === "publish" ? "published immediately" :
                `scheduled starting ${startDate ? new Date(startDate).toLocaleString() : "now"}`
              }
            </span>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {generatedCount} / {totalCount}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !selectedTemplate}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate {getVariables().length} Articles
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Batches */}
      {batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{batch.batch_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.generated_count} / {batch.total_articles} articles
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      batch.status === "published" ? "default" :
                      batch.status === "scheduled" ? "secondary" :
                      batch.status === "completed" ? "outline" :
                      batch.status === "generating" ? "outline" :
                      "destructive"
                    }>
                      {batch.status === "published" ? "Published" :
                       batch.status === "scheduled" ? "Scheduled" :
                       batch.status === "completed" ? "Completed" :
                       batch.status === "generating" ? "Generating" :
                       batch.status}
                    </Badge>
                    {(batch.status === "completed" || batch.status === "completed_with_errors") && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleScheduleBatch(batch.id)}>
                          <Clock className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                        <Button size="sm" onClick={() => handlePublishBatch(batch.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Publish All
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
