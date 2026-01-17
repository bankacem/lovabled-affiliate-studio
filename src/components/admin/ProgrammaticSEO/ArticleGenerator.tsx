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
import { Rocket, Play, Pause, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

import type { Json } from "@/integrations/supabase/types";

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
      // Custom: parse JSON array
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
    let slug = replaceVariables(template, variables);
    slug = slug.toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Ensure it starts with 'p-'
    if (!slug.startsWith("p-")) {
      slug = "p-" + slug;
    }
    
    return slug;
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error("يرجى اختيار قالب");
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const variables = getVariables();
    if (variables.length === 0) {
      toast.error("يرجى إدخال المتغيرات");
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
      toast.error("فشل في إنشاء الدفعة");
      setIsGenerating(false);
      return;
    }

    const batchId = batchData.id;
    let successCount = 0;
    const errorMessages: string[] = [];

    // Generate articles in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < variables.length; i += BATCH_SIZE) {
      const chunk = variables.slice(i, Math.min(i + BATCH_SIZE, variables.length));
      
      const articles = chunk.map((vars: Record<string, string>) => {
        const slug = generateSlug(template.slug_template, vars);
        
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
          status: "generated_draft",
          author_name: "AI Generator",
        };
      });

      // Check for existing slugs to avoid conflicts
      const slugs = articles.map(a => a.slug);
      const { data: existingSlugs } = await supabase
        .from("blog_posts")
        .select("slug")
        .in("slug", slugs);

      const existingSlugSet = new Set(existingSlugs?.map(s => s.slug) || []);
      const newArticles = articles.filter(a => !existingSlugSet.has(a.slug));
      const skippedCount = articles.length - newArticles.length;

      if (skippedCount > 0) {
        errorMessages.push(`تم تخطي ${skippedCount} مقالات بسبب تكرار الـ Slug`);
      }

      if (newArticles.length > 0) {
        const { error } = await supabase
          .from("blog_posts")
          .insert(newArticles);

        if (error) {
          errorMessages.push(`خطأ في الدفعة ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          successCount += newArticles.length;
        }
      }

      setGeneratedCount(i + chunk.length);
      setProgress(((i + chunk.length) / variables.length) * 100);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update batch status
    await supabase
      .from("generation_batches")
      .update({
        generated_count: successCount,
        status: errorMessages.length > 0 ? "completed_with_errors" : "completed"
      })
      .eq("id", batchId);

    setErrors(errorMessages);
    setIsGenerating(false);
    
    if (errorMessages.length === 0) {
      toast.success(`تم توليد ${successCount} مقال بنجاح!`);
    } else {
      toast.warning(`تم توليد ${successCount} مقال مع بعض الأخطاء`);
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
      toast.error("فشل في نشر المقالات");
    } else {
      toast.success("تم نشر جميع مقالات الدفعة");
      
      // Update batch status
      await supabase
        .from("generation_batches")
        .update({ status: "published" })
        .eq("id", batchId);
      
      fetchData();
    }
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
        <h2 className="text-2xl font-bold">مولد المقالات</h2>
        <p className="text-muted-foreground">توليد مقالات Programmatic SEO بشكل آلي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            توليد دفعة جديدة
          </CardTitle>
          <CardDescription>
            اختر قالب وحدد المتغيرات لتوليد مقالات متعددة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>القالب</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالب" />
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
              <Label>اسم الدفعة</Label>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Birthday 1990-2010"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>نوع المتغيرات</Label>
            <Select value={variableType} onValueChange={(v: typeof variableType) => setVariableType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="years">سنوات (Years)</SelectItem>
                <SelectItem value="cities">مدن (Cities)</SelectItem>
                <SelectItem value="professions">مهن (Professions)</SelectItem>
                <SelectItem value="custom">مخصص (Custom JSON)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {variableType === "years" && (
            <div className="space-y-2">
              <Label>نطاق السنوات</Label>
              <Select value={selectedYearRange} onValueChange={setSelectedYearRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(YEAR_RANGES).map((range) => (
                    <SelectItem key={range} value={range}>
                      {range} ({YEAR_RANGES[range as keyof typeof YEAR_RANGES].length} سنة)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {variableType === "custom" && (
            <div className="space-y-2">
              <Label>المتغيرات (JSON Array)</Label>
              <Textarea
                value={variablesInput}
                onChange={(e) => setVariablesInput(e.target.value)}
                placeholder='[{"year": "1990", "age": "35"}, {"year": "1991", "age": "34"}]'
                className="font-mono text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              سيتم توليد {getVariables().length} مقال بحالة "generated_draft"
            </span>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>التقدم: {generatedCount} / {totalCount}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

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

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !selectedTemplate}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                بدء التوليد
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الدفعات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{batch.batch_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.generated_count} / {batch.total_articles} مقال
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      batch.status === "published" ? "default" :
                      batch.status === "completed" ? "secondary" :
                      batch.status === "generating" ? "outline" :
                      "destructive"
                    }>
                      {batch.status === "published" ? "منشور" :
                       batch.status === "completed" ? "مكتمل" :
                       batch.status === "generating" ? "قيد التوليد" :
                       batch.status}
                    </Badge>
                    {batch.status === "completed" && (
                      <Button size="sm" onClick={() => handlePublishBatch(batch.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        نشر الكل
                      </Button>
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
