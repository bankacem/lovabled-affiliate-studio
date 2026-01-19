import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FolderOpen, 
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface GenerationBatch {
  id: string;
  batch_name: string;
  template_id: string | null;
  total_articles: number;
  generated_count: number;
  published_count: number;
  status: string;
  variables_data: Json;
  created_at: string;
  updated_at: string;
}

interface BatchArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
}

interface ArticleStats {
  totalProgrammatic: number;
  totalAIGenerated: number;
  totalManual: number;
  draftCount: number;
  publishedCount: number;
  scheduledCount: number;
}

export function BatchManager() {
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<GenerationBatch | null>(null);
  const [batchArticles, setBatchArticles] = useState<BatchArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<ArticleStats>({
    totalProgrammatic: 0,
    totalAIGenerated: 0,
    totalManual: 0,
    draftCount: 0,
    publishedCount: 0,
    scheduledCount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const [batchesRes, statsRes] = await Promise.all([
      supabase
        .from("generation_batches")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("blog_posts")
        .select("source, status")
    ]);

    if (batchesRes.data) setBatches(batchesRes.data);
    
    if (statsRes.data) {
      const programmatic = statsRes.data.filter(p => p.source === "programmatic");
      const aiGenerated = statsRes.data.filter(p => p.source === "ai_generated");
      const manual = statsRes.data.filter(p => p.source === "manual" || !p.source);
      const drafts = statsRes.data.filter(p => p.status === "draft" || p.status === "generated_draft");
      const published = statsRes.data.filter(p => p.status === "published");
      const scheduled = statsRes.data.filter(p => p.status === "scheduled");
      
      setStats({
        totalProgrammatic: programmatic.length,
        totalAIGenerated: aiGenerated.length,
        totalManual: manual.length,
        draftCount: drafts.length,
        publishedCount: published.length,
        scheduledCount: scheduled.length
      });
    }

    setIsLoading(false);
  };

  const viewBatchArticles = async (batch: GenerationBatch) => {
    setSelectedBatch(batch);
    setIsLoadingArticles(true);

    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, status, created_at")
      .eq("generation_batch", batch.id)
      .order("created_at", { ascending: false })
      .limit(100);

    setBatchArticles(data || []);
    setIsLoadingArticles(false);
  };

  const publishBatch = async (batchId: string) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({ 
        status: "published", 
        published_at: new Date().toISOString() 
      })
      .eq("generation_batch", batchId)
      .eq("status", "generated_draft")
      .select("id");

    if (error) {
      toast.error("Failed to publish articles");
      return;
    }

    const publishedCount = data?.length || 0;

    await supabase
      .from("generation_batches")
      .update({ 
        status: "published",
        published_count: publishedCount
      })
      .eq("id", batchId);

    toast.success(`Published ${publishedCount} articles`);
    fetchData();
  };

  const deleteBatch = async (batchId: string) => {
    const { error: articlesError } = await supabase
      .from("blog_posts")
      .delete()
      .eq("generation_batch", batchId);

    if (articlesError) {
      toast.error("Failed to delete articles");
      return;
    }

    const { error: batchError } = await supabase
      .from("generation_batches")
      .delete()
      .eq("id", batchId);

    if (batchError) {
      toast.error("Failed to delete batch");
    } else {
      toast.success("Batch and all articles deleted");
      fetchData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "completed": return "secondary";
      case "generating": return "outline";
      case "completed_with_errors": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published": return "Published";
      case "completed": return "Completed";
      case "generating": return "Generating";
      case "completed_with_errors": return "Has Errors";
      case "pending": return "Pending";
      default: return status;
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batch_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Batch Manager
          </h2>
          <p className="text-muted-foreground">Track and publish programmatically generated articles</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAIGenerated}</p>
                <p className="text-xs text-muted-foreground">AI Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalProgrammatic}</p>
                <p className="text-xs text-muted-foreground">Programmatic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.publishedCount}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduledCount}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draftCount}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalManual}</p>
                <p className="text-xs text-muted-foreground">Manual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="completed_with_errors">Has Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpen className="h-5 w-5" />
            All Batches ({filteredBatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted rounded-full inline-block mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No batches found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Use the Batch Generator to create a new batch"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {batch.generated_count} / {batch.total_articles}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress 
                            value={(batch.generated_count / batch.total_articles) * 100} 
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(batch.status)}>
                          {getStatusLabel(batch.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(batch.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => viewBatchArticles(batch)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FolderOpen className="h-5 w-5" />
                                  {selectedBatch?.batch_name}
                                </DialogTitle>
                                <DialogDescription>
                                  Showing up to 100 articles from this batch
                                </DialogDescription>
                              </DialogHeader>
                              {isLoadingArticles ? (
                                <div className="flex justify-center py-12">
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                              ) : (
                                <ScrollArea className="flex-1 max-h-[calc(80vh-140px)]">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {batchArticles.map((article) => (
                                        <TableRow key={article.id}>
                                          <TableCell className="font-medium max-w-[250px] truncate">
                                            {article.title}
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground font-mono max-w-[150px] truncate">
                                            /{article.slug}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={article.status === "published" ? "default" : "secondary"}>
                                              {article.status === "published" ? "Published" : "Draft"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            {article.status === "published" && (
                                              <Button variant="ghost" size="sm" asChild>
                                                <a href={`/blog/${article.slug}`} target="_blank">
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                              </Button>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </ScrollArea>
                              )}
                            </DialogContent>
                          </Dialog>

                          {batch.status === "completed" && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => publishBatch(batch.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the batch and all {batch.generated_count} articles associated with it.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteBatch(batch.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
