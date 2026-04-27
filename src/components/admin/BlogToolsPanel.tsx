import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Upload, 
  Map, 
  RefreshCw, 
  FileJson,
  Archive,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogToolsPanelProps {
  onSitemapGenerated?: () => void;
}

export function BlogToolsPanel({ onSitemapGenerated }: BlogToolsPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastSitemapUpdate, setLastSitemapUpdate] = useState<Date | null>(null);

  const exportAllPosts = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Fetch all posts
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setExportProgress(50);

      // Create JSON file
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalPosts: posts?.length || 0,
        posts: posts || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: "application/json" 
      });
      const url = URL.createObjectURL(blob);
      
      setExportProgress(80);

      // Download file
      const a = document.createElement("a");
      a.href = url;
      a.download = `blog-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      toast.success(`Exported ${posts?.length || 0} posts successfully!`);
    } catch (error: any) {
      toast.error("Failed to export posts: " + error.message);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  const generateSitemap = async () => {
    setIsGeneratingSitemap(true);

    try {
      // Fetch all published posts
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;

      // Generate sitemap XML
      const baseUrl = "https://aiprintverse.com";
      const sitemapEntries = posts?.map(post => `
    <url>
      <loc>${baseUrl}/blog/${post.slug}</loc>
      <lastmod>${new Date(post.updated_at || post.published_at).toISOString().split("T")[0]}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`).join("") || "";

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${baseUrl}</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    <url>
      <loc>${baseUrl}/blog</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
    <url>
      <loc>${baseUrl}/designs</loc>
      <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>${sitemapEntries}
</urlset>`;

      // Download sitemap
      const blob = new Blob([sitemap], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastSitemapUpdate(new Date());
      toast.success(`Sitemap generated with ${posts?.length || 0} blog URLs!`);
      onSitemapGenerated?.();
    } catch (error: any) {
      toast.error("Failed to generate sitemap: " + error.message);
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const tools = [
    {
      icon: Archive,
      title: "Backup All Posts",
      description: "Export all blog posts to JSON file",
      action: exportAllPosts,
      loading: isExporting,
      color: "text-blue-500"
    },
    {
      icon: Map,
      title: "Generate Sitemap",
      description: "Create XML sitemap for SEO",
      action: generateSitemap,
      loading: isGeneratingSitemap,
      color: "text-green-500"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileJson className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Blog Tools</h3>
      </div>

      <div className="grid gap-3">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${tool.color}`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{tool.title}</h4>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  
                  {tool.loading && tool.title === "Backup All Posts" && (
                    <div className="mt-2">
                      <Progress value={exportProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Exporting... {exportProgress}%
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={tool.action}
                  disabled={tool.loading}
                >
                  {tool.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {lastSitemapUpdate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Last sitemap: {lastSitemapUpdate.toLocaleString()}</span>
        </div>
      )}

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">SEO Tip</p>
            <p className="text-xs text-muted-foreground mt-1">
              After adding new articles, generate a fresh sitemap and submit it to Google Search Console for faster indexing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
