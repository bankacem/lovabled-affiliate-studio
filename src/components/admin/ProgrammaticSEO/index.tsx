import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "./TemplateManager";
import { ArticleGenerator } from "./ArticleGenerator";
import { BatchManager } from "./BatchManager";
import { AIArticleGenerator } from "./AIArticleGenerator";
import { FileText, Rocket, FolderOpen, Sparkles } from "lucide-react";

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
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="ai-generator" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generator
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
        </TabsList>

        <TabsContent value="ai-generator">
          <AIArticleGenerator />
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
      </Tabs>
    </div>
  );
}

export { TemplateManager } from "./TemplateManager";
export { ArticleGenerator } from "./ArticleGenerator";
export { BatchManager } from "./BatchManager";
export { AIArticleGenerator } from "./AIArticleGenerator";
