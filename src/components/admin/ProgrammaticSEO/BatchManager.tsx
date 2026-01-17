import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Trash2, CheckCircle2, XCircle, Loader2, FolderOpen, FileText } from "lucide-react";
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

export function BatchManager() {
  const [batches, setBatches] = useState<GenerationBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<GenerationBatch | null>(null);
  const [batchArticles, setBatchArticles] = useState<BatchArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [stats, setStats] = useState({
    totalProgrammatic: 0,
    totalManual: 0,
    draftCount: 0,
    publishedCount: 0
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
      const manual = statsRes.data.filter(p => p.source === "manual");
      const drafts = statsRes.data.filter(p => p.status === "generated_draft");
      const published = statsRes.data.filter(p => p.status === "published");
      
      setStats({
        totalProgrammatic: programmatic.length,
        totalManual: manual.length,
        draftCount: drafts.length,
        publishedCount: published.length
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
      toast.error("فشل في نشر المقالات");
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

    toast.success(`تم نشر ${publishedCount} مقال`);
    fetchData();
  };

  const deleteBatch = async (batchId: string) => {
    // First delete all articles in the batch
    const { error: articlesError } = await supabase
      .from("blog_posts")
      .delete()
      .eq("generation_batch", batchId);

    if (articlesError) {
      toast.error("فشل في حذف المقالات");
      return;
    }

    // Then delete the batch record
    const { error: batchError } = await supabase
      .from("generation_batches")
      .delete()
      .eq("id", batchId);

    if (batchError) {
      toast.error("فشل في حذف الدفعة");
    } else {
      toast.success("تم حذف الدفعة وجميع مقالاتها");
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
      case "published": return "منشور";
      case "completed": return "مكتمل";
      case "generating": return "قيد التوليد";
      case "completed_with_errors": return "مكتمل مع أخطاء";
      case "pending": return "معلق";
      default: return status;
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
        <h2 className="text-2xl font-bold">إدارة الدفعات</h2>
        <p className="text-muted-foreground">تتبع ونشر المقالات المولدة برمجياً</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المقالات البرمجية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProgrammatic}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المقالات اليدوية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalManual}</div>
            <p className="text-xs text-muted-foreground">محمية ✓</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مسودات للمراجعة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>منشورة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.publishedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            جميع الدفعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد دفعات بعد. استخدم المولد لإنشاء دفعة جديدة.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الدفعة</TableHead>
                  <TableHead>المقالات</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell>
                      {batch.generated_count} / {batch.total_articles}
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress 
                          value={(batch.generated_count / batch.total_articles) * 100} 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(batch.status)}>
                        {getStatusLabel(batch.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(batch.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewBatchArticles(batch)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>مقالات: {selectedBatch?.batch_name}</DialogTitle>
                              <DialogDescription>
                                عرض أول 100 مقال من هذه الدفعة
                              </DialogDescription>
                            </DialogHeader>
                            {isLoadingArticles ? (
                              <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>الرابط</TableHead>
                                    <TableHead>الحالة</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {batchArticles.map((article) => (
                                    <TableRow key={article.id}>
                                      <TableCell className="font-medium truncate max-w-[200px]">
                                        {article.title}
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                                        /{article.slug}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={article.status === "published" ? "default" : "secondary"}>
                                          {article.status === "published" ? "منشور" : "مسودة"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </DialogContent>
                        </Dialog>

                        {batch.status === "completed" && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => publishBatch(batch.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف الدفعة؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الدفعة وجميع المقالات المرتبطة بها ({batch.generated_count} مقال).
                                هذا الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBatch(batch.id)}>
                                حذف
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
