import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  FileText,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SchedulingPanel } from "./SchedulingPanel";
import { ImportSearchData } from "./ImportSearchData";
import { SEOCTRBooster } from "./SEOCTRBooster";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  featured_image: string | null;
  author_name: string;
  scheduled_publish_at: string | null;
  impressions: number | null;
  clicks: number | null;
}

interface BlogPostsListProps {
  onNewPost: () => void;
  onEditPost: (id: string) => void;
}

const ITEMS_PER_PAGE = 20;

export function BlogPostsListOptimized({ onNewPost, onEditPost }: BlogPostsListProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter, sourceFilter]);

  const fetchPosts = async () => {
    setIsLoading(true);
    
    // Build query
    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, category, status, source, created_at, updated_at, featured_image, author_name, scheduled_publish_at, impressions, clicks", { count: "exact" });

    // Apply filters
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (sourceFilter !== "all") {
      query = query.eq("source", sourceFilter);
    }

    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load posts");
    } else {
      setPosts(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.slug.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const deletePost = async (id: string) => {
    // FIXED: Removed window.confirm()
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      setPosts(posts.filter((p) => p.id !== id));
      const newSelected = new Set(selectedPosts);
      newSelected.delete(id);
      setSelectedPosts(newSelected);
      toast.success("Post deleted successfully");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ 
        status,
        published_at: status === "published" ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
      toast.success(`Post ${status === "published" ? "published" : "unpublished"}`);
    }
  };

  const toggleSelectPost = useCallback((id: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPosts(newSelected);
  }, [selectedPosts]);

  const toggleSelectAll = useCallback(() => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  }, [selectedPosts, filteredPosts]);

  const selectUnpublished = useCallback(() => {
    const unpublishedIds = posts
      .filter(p => p.status === "draft" || p.status === "generated_draft")
      .map(p => p.id);
    setSelectedPosts(new Set(unpublishedIds));
    toast.info(`Selected ${unpublishedIds.length} unpublished posts`);
  }, [posts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "draft":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "generated_draft":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // High Potential: impressions > 100 but CTR < 2%
  const isHighPotential = (post: BlogPost) => {
    if (!post.impressions || post.impressions < 100) return false;
    const ctr = post.clicks ? (post.clicks / post.impressions) * 100 : 0;
    return ctr < 2;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "programmatic":
        return <Badge variant="outline" className="text-xs">P-SEO</Badge>;
      case "ai_generated":
        return <Badge variant="outline" className="text-xs bg-primary/10">AI</Badge>;
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blog Posts</h2>
          <p className="text-muted-foreground">
            {totalCount} total posts • Page {currentPage} of {totalPages || 1}
          </p>
        </div>
        <div className="flex gap-2">
          <ImportSearchData onImportComplete={fetchPosts} />
          <Button onClick={onNewPost}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters & Actions */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generated_draft">AI Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="programmatic">P-SEO</SelectItem>
                <SelectItem value="ai_generated">AI Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="gap-2"
            >
              {selectedPosts.size === filteredPosts.length && filteredPosts.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedPosts.size > 0 ? `${selectedPosts.size} selected` : "Select All"}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={selectUnpublished}>
              Select Unpublished
            </Button>

            <div className="flex-1" />

            <SchedulingPanel 
              selectedPostIds={Array.from(selectedPosts)} 
              onScheduleComplete={() => {
                setSelectedPosts(new Set());
                fetchPosts();
              }}
            />
          </div>
        </div>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading posts...
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No posts found
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" || sourceFilter !== "all"
              ? "Try adjusting your filters" 
              : "Get started by creating your first blog post"}
          </p>
          {!searchQuery && statusFilter === "all" && sourceFilter === "all" && (
            <Button onClick={onNewPost}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className={`p-4 transition-all ${
                  selectedPosts.has(post.id) ? "ring-2 ring-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedPosts.has(post.id)}
                    onCheckedChange={() => toggleSelectPost(post.id)}
                    className="mt-1"
                  />
                  
                  {/* Thumbnail */}
                  <div className="hidden sm:block w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          /{post.slug}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* SEO CTR Booster Button */}
                        <SEOCTRBooster
                          postId={post.id}
                          currentTitle={post.title}
                          onTitleUpdated={fetchPosts}
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditPost(post.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a 
                                href={`/blog/${post.slug}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {post.status !== "published" ? (
                              <DropdownMenuItem onClick={() => updateStatus(post.id, "published")}>
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateStatus(post.id, "draft")}>
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setPostToDelete(post.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className={getStatusColor(post.status)}>
                        {post.status === "generated_draft" ? "AI Draft" : post.status}
                      </Badge>
                      {getSourceBadge(post.source)}
                      <Badge variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {post.category}
                      </Badge>
                      
                      {/* Impressions & Clicks */}
                      {post.impressions !== null && post.impressions > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {post.impressions.toLocaleString()} impr
                          {post.clicks !== null && post.clicks > 0 && (
                            <span className="text-green-600">• {post.clicks} clicks</span>
                          )}
                        </span>
                      )}
                      
                      {/* High Potential Badge */}
                      {isHighPotential(post) && (
                        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs gap-1">
                          <Zap className="h-3 w-3" />
                          High Potential
                        </Badge>
                      )}
                      
                      {post.scheduled_publish_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.scheduled_publish_at), "MMM d, HH:mm")}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={postToDelete !== null} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && deletePost(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
