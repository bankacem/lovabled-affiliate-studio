import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "./TemplateManager";
import { ArticleGenerator } from "./ArticleGenerator";
import { BatchManager } from "./BatchManager";
import { AIArticleGenerator } from "./AIArticleGenerator";
import { MissingImageGenerator } from "./MissingImageGenerator";
import { SERPAnalyzer } from "./SERPAnalyzer";
import { FileText, Rocket, FolderOpen, Sparkles, Image, Target } from "lucide-react";

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
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="ai-generator" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="serp" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            SERP Engine
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Batch Generator
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

        <TabsContent value="ai-generator">
          <AIArticleGenerator />
        </TabsContent>

        <TabsContent value="serp">
          <SERPAnalyzer />
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
