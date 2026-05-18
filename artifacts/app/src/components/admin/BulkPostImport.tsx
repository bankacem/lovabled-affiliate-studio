import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Tag,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  ArrowUpDown,
  Filter,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SchedulingPanel } from "./SchedulingPanel";

interface ImportedPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  date: string;
  publishDate: string;
  readTime: string;
  image: string;
  status: string;
  featured: boolean;
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  views: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkPostImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importedPosts, setImportedPosts] = useState<ImportedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewPost, setPreviewPost] = useState<ImportedPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"title" | "date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importedPostDbIds, setImportedPostDbIds] = useState<string[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Clean HTML content - extract body content and remove DOCTYPE/html/body tags
  const cleanHtmlContent = (html: string): string => {
    if (!html) return "";
    
    // Remove DOCTYPE, html, head, and body tags but keep the content
    let cleaned = html
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .trim();
    
    // If content starts with code block markers (from AI generated content), extract the HTML
    if (cleaned.startsWith("```html")) {
      cleaned = cleaned.replace(/^```html\s*/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }
    
    return cleaned;
  };

  // Extract a clean title from potentially messy title content
  const extractCleanTitle = (rawTitle: string): string => {
    if (!rawTitle) return "Untitled Post";
    
    // If title contains suggestions or multiple options, try to extract the first good one
    if (rawTitle.includes("###") || rawTitle.includes("**") || rawTitle.length > 200) {
      // Try to find a title in bold **Title**
      const boldMatch = rawTitle.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch[1].length < 100) {
        return boldMatch[1].trim();
      }
      
      // Try to find title after a colon
      const colonMatch = rawTitle.match(/:\s*\*?\*?([^*\n]+)\*?\*?/);
      if (colonMatch && colonMatch[1].length < 100) {
        return colonMatch[1].trim();
      }
      
      // Just take first 80 characters
      return rawTitle.substring(0, 80).replace(/[#*]/g, "").trim() + "...";
    }
    
    return rawTitle.trim();
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a JSON file");
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      let posts: ImportedPost[] = [];
      
      // Handle different JSON structures
      if (Array.isArray(data)) {
        posts = data;
      } else if (data.posts && Array.isArray(data.posts)) {
        posts = data.posts;
      } else {
        throw new Error("Invalid JSON structure. Expected array or {posts: [...]}");
      }

      if (posts.length === 0) {
        throw new Error("No posts found in the file");
      }

      // Clean and process each post
      const processedPosts = posts.map(post => ({
        ...post,
        title: extractCleanTitle(post.title),
        content: cleanHtmlContent(post.content),
        excerpt: post.excerpt ? extractCleanTitle(post.excerpt).substring(0, 300) : "",
        seoTitle: post.seoTitle ? extractCleanTitle(post.seoTitle) : "",
      }));

      setImportedPosts(processedPosts);
      setSelectedPosts(new Set(processedPosts.map(p => p.id)));
      toast.success(`Loaded ${processedPosts.length.toLocaleString()} posts from file`);
    } catch (error: any) {
      toast.error(`Failed to parse file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string): string => {
    const raw = title
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Truncate at word boundary (max 75 chars) to avoid cutting words mid-way
    if (raw.length <= 75) return raw;
    const truncated = raw.slice(0, 75);
    const lastHyphen = truncated.lastIndexOf('-');
    return lastHyphen > 30 ? truncated.slice(0, lastHyphen) : truncated;
  };

  const importPosts = async () => {
    const postsToImport = importedPosts.filter(p => selectedPosts.has(p.id));
    
    if (postsToImport.length === 0) {
      toast.error("No posts selected for import");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportedPostDbIds([]);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };
    const importedPostIds: string[] = [];

    const batchSize = 50; // Import in batches for better performance
    const batches = Math.ceil(postsToImport.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = postsToImport.slice(i * batchSize, (i + 1) * batchSize);
      
      const postsData = batch.map(post => {
        // IMPORTANT: Import all posts as DRAFT by default
        // Users can then use the scheduling panel to publish/schedule them
        const status = "draft";
        let publishedAt = null;
        let scheduledAt = null;
        
        // If the post has a publish date, save it as scheduled_publish_at
        if (post.publishDate) {
          scheduledAt = new Date(post.publishDate).toISOString();
        }
        
        // Extract keywords from seoKeywords field or tags
        const keywords = post.seoKeywords 
          ? post.seoKeywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : (post.tags ? post.tags.split(",").map((t: string) => t.trim()).slice(0, 10) : []);
        
        return {
          title: post.title,
          slug: generateSlug(post.title) + `-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          excerpt: post.excerpt || null,
          content: post.content || null,
          category: post.category || "General",
          tags: post.tags ? post.tags.split(",").map((t: string) => t.trim()) : [],
          featured_image: post.image || null,
          status: status,
          published_at: publishedAt,
          scheduled_publish_at: scheduledAt,
          read_time: post.readTime || null,
          meta_title: post.seoTitle || post.title,
          meta_description: post.seoDesc || post.excerpt,
          author_name: "Admin"
        };
      });

      const { data, error } = await supabase
        .from("blog_posts")
        .insert(postsData)
        .select();

      if (error) {
        result.failed += batch.length;
        result.errors.push(`Batch ${i + 1}: ${error.message}`);
      } else {
        result.success += data?.length || 0;
        // Store imported post IDs for scheduling
        if (data) {
          importedPostIds.push(...data.map(p => p.id));
        }
      }

      setImportProgress(Math.round(((i + 1) / batches) * 100));
    }

    setImportResult(result);
    setImportedPostDbIds(importedPostIds);
    setIsImporting(false);

    if (result.success > 0) {
      toast.success(`Imported ${result.success.toLocaleString()} posts as drafts. Use the scheduling panel to publish them.`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed.toLocaleString()} posts`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  const togglePostSelection = (id: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPosts(newSelected);
  };

  const deleteSelectedPosts = () => {
    setImportedPosts(posts => posts.filter(p => !selectedPosts.has(p.id)));
    setSelectedPosts(new Set());
    setShowDeleteConfirm(false);
    toast.success("Selected posts removed from import list");
  };

  const clearAll = () => {
    setImportedPosts([]);
    setSelectedPosts(new Set());
    setImportResult(null);
    setImportProgress(0);
  };

  // Filter and sort posts
  const filteredPosts = importedPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          comparison = new Date(a.publishDate || a.date).getTime() - new Date(b.publishDate || b.date).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Extract headings from HTML content for preview
  const extractHeadings = (html: string) => {
    const headings: { level: number; text: string }[] = [];
    const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        headings.push({ level: parseInt(match[1]), text });
      }
    }
    return headings;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bulk Import Posts</h2>
          <p className="text-muted-foreground">
            Import up to 100,000+ blog posts from JSON file
          </p>
        </div>
        {importedPosts.length > 0 && (
          <Button variant="outline" onClick={clearAll}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {importedPosts.length === 0 && (
        <Card
          className={`p-12 border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <FileJson className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {isLoading ? "Processing file..." : "Drop JSON file here"}
            </h3>
            <p className="text-muted-foreground mb-4">
              or click to browse your files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              Select JSON File
            </Button>

            {/* JSON Format Guide */}
            <div className="mt-8 text-left max-w-lg mx-auto">
              <h4 className="text-sm font-medium text-foreground mb-2">Expected JSON Format:</h4>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "posts": [
    {
      "id": "unique-id",
      "title": "Post Title",
      "excerpt": "Short description",
      "content": "<h2>Heading</h2><p>Content...</p>",
      "category": "General",
      "tags": "tag1, tag2",
      "publishDate": "2026-01-15T10:00:00Z",
      "status": "draft|published|scheduled",
      "image": "https://...",
      "seoTitle": "SEO Title",
      "seoDesc": "SEO Description"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Import Progress */}
      {isImporting && (
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Importing posts...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we import your posts
              </p>
            </div>
          </div>
          <Progress value={importProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-right">
            {importProgress}% complete
          </p>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              importResult.failed === 0 ? "bg-green-100" : "bg-yellow-100"
            }`}>
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Import Complete - All Posts Saved as Drafts</h3>
              <p className="text-sm text-muted-foreground">
                Imported {importResult.success.toLocaleString()} posts as drafts
                {importResult.failed > 0 && `, ${importResult.failed.toLocaleString()} failed`}
              </p>
              <p className="text-xs text-primary mt-1">
                Use the scheduling panel below to publish or schedule your posts
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-destructive">Errors:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>...and {importResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={clearAll}>
              Import More
            </Button>
          </div>
          
          {/* Scheduling Panel for imported posts */}
          {importedPostDbIds.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule or Publish Imported Posts
              </h4>
              <SchedulingPanel 
                selectedPostIds={importedPostDbIds} 
                onScheduleComplete={() => {
                  toast.success("Posts scheduled/published successfully!");
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Posts List */}
      {importedPosts.length > 0 && !isImporting && !importResult && (
        <>
          {/* Toolbar */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedPosts.size.toLocaleString()} of {importedPosts.length.toLocaleString()} selected
                  </span>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Actions Bar */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={importPosts} disabled={selectedPosts.size === 0}>
              <Upload className="h-4 w-4 mr-2" />
              Import {selectedPosts.size.toLocaleString()} Posts
            </Button>
            
            {selectedPosts.size > 0 && (
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected
              </Button>
            )}
          </div>

          {/* Posts Grid */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredPosts.map((post, index) => {
                const headings = extractHeadings(post.content || "");
                const isSelected = selectedPosts.has(post.id);
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  >
                    <Card className={`p-4 transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePostSelection(post.id)}
                        />
                        
                        {/* Thumbnail */}
                        {post.image && (
                          <div className="hidden sm:block w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground line-clamp-1">
                              {post.title}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewPost(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {post.excerpt}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {post.category}
                            </Badge>
                            {post.publishDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(post.publishDate), "MMM d, yyyy HH:mm")}
                              </span>
                            )}
                            {headings.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {headings.length} headings
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Showing count */}
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredPosts.length.toLocaleString()} of {importedPosts.length.toLocaleString()} posts
          </p>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{previewPost?.title}</DialogTitle>
          </DialogHeader>
          
          {previewPost && (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(previewPost.status)}>
                    {previewPost.status}
                  </Badge>
                  <Badge variant="outline">{previewPost.category}</Badge>
                  {previewPost.featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                </div>

                {/* Featured Image */}
                {previewPost.image && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={previewPost.image}
                      alt={previewPost.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Headings Structure */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Structure
                  </h4>
                  <div className="space-y-1">
                    {extractHeadings(previewPost.content || "").map((heading, i) => (
                      <div
                        key={i}
                        className="text-sm"
                        style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
                      >
                        <span className="text-muted-foreground">H{heading.level}:</span>{" "}
                        <span className="text-foreground">{heading.text}</span>
                      </div>
                    ))}
                    {extractHeadings(previewPost.content || "").length === 0 && (
                      <p className="text-sm text-muted-foreground">No headings found</p>
                    )}
                  </div>
                </div>

                {/* SEO Info */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3">SEO Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title: </span>
                      <span className="text-foreground">{previewPost.seoTitle || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Description: </span>
                      <span className="text-foreground">{previewPost.seoDesc || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Keywords: </span>
                      <span className="text-foreground">{previewPost.seoKeywords || "Not set"}</span>
                    </div>
                    {previewPost.seoScore && (
                      <div>
                        <span className="text-muted-foreground">SEO Score: </span>
                        <span className={`font-medium ${
                          previewPost.seoScore >= 80 ? "text-green-600" :
                          previewPost.seoScore >= 50 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {previewPost.seoScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Content Preview</h4>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 bg-background"
                    dangerouslySetInnerHTML={{ __html: previewPost.content || "" }}
                  />
                </div>

                {/* Publish Date */}
                {previewPost.publishDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Scheduled for: {format(new Date(previewPost.publishDate), "PPpp")}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Posts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedPosts.size.toLocaleString()} posts from the import list.
              They will not be imported to the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedPosts}>
              Remove Posts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
