import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "./TemplateManager";
import { ArticleGenerator } from "./ArticleGenerator";
import { BatchManager } from "./BatchManager";
import { AIArticleGenerator } from "./AIArticleGenerator";
import { MissingImageGenerator } from "./MissingImageGenerator";
import { SERPAnalyzer } from "./SERPAnalyzer";
import { SEOAnalyticsEngine } from "./SEOAnalyticsEngine";
import { AIInternalLinker } from "./AIInternalLinker";
import { FileText, Rocket, FolderOpen, Sparkles, Image, Target, BarChart3, Link2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function ProgrammaticSEO() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Programmatic SEO Engine</h1>
        <p className="text-muted-foreground">
          AI-powered article generation with professional SEO structure
        </p>
      </div>

      <Tabs defaultValue="ai-generator" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="ai-generator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generator
            </TabsTrigger>
            <TabsTrigger value="serp" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              SERP Engine
            </TabsTrigger>
            <TabsTrigger value="seo-analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              SEO Analytics
            </TabsTrigger>
            <TabsTrigger value="internal-links" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              AI Linking
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Batches
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="ai-generator">
          <AIArticleGenerator />
        </TabsContent>

        <TabsContent value="serp">
          <SERPAnalyzer />
        </TabsContent>

        <TabsContent value="seo-analytics">
          <SEOAnalyticsEngine />
        </TabsContent>

        <TabsContent value="internal-links">
          <AIInternalLinker />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="generator">
          <ArticleGenerator />
        </TabsContent>

        <TabsContent value="batches">
          <BatchManager />
        </TabsContent>

        <TabsContent value="images">
          <MissingImageGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { TemplateManager } from "./TemplateManager";
export { ArticleGenerator } from "./ArticleGenerator";
export { BatchManager } from "./BatchManager";
export { AIArticleGenerator } from "./AIArticleGenerator";
export { MissingImageGenerator } from "./MissingImageGenerator";
export { SERPAnalyzer } from "./SERPAnalyzer";
export { SEOAnalyticsEngine } from "./SEOAnalyticsEngine";
export { AIInternalLinker } from "./AIInternalLinker";
