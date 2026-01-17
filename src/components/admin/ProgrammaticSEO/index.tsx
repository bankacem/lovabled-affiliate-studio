import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateManager } from "./TemplateManager";
import { ArticleGenerator } from "./ArticleGenerator";
import { BatchManager } from "./BatchManager";
import { FileText, Rocket, FolderOpen } from "lucide-react";

export function ProgrammaticSEO() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Programmatic SEO Engine</h1>
        <p className="text-muted-foreground">
          نظام توليد المقالات الآلي للوصول إلى مليون مقال
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            القوالب
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            المولد
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            الدفعات
          </TabsTrigger>
        </TabsList>

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
