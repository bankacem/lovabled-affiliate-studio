import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Save, 
  Archive,
  ArrowLeft, 
  Image as ImageIcon,
  Tag,
  FileText,
  Settings,
  Send,
  Link2,
  Code,
  Calendar,
  Clock,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "./RichTextEditor";
import { InternalLinkingTool } from "./InternalLinkingTool";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  video_url: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "scheduled" | "archived";
  meta_title: string;
  meta_description: string;
  read_time: string;
  author_name: string;
  scheduled_publish_at?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPostEditorProps {
  postId?: string;
  onBack: () => void;
}

const extractYoutubeId = (url: string): string => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : '';
};

export function BlogPostEditor({ postId, onBack }: BlogPostEditorProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [showLinkingTool, setShowLinkingTool] = useState(false);
  
  const [post, setPost] = useState<BlogPost>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    video_url: "",
    category: "General",
    tags: [],
    status: "draft",
    meta_title: "",
    meta_description: "",
    read_time: "5 min read",
    author_name: "Admin",
    scheduled_publish_at: null,
  });
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    fetchCategories();
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  const fetchCategories = async () => {
    if (!supabase || typeof supabase.from !== 'function') return;
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name");
    
    if (data) {
      setCategories(data);
    }
  };

  const fetchPost = async (id: string) => {
    if (!supabase || typeof supabase.from !== 'function') return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load post");
      onBack();
    } else if (data) {
      const d = data as any;
      setPost({
        id: d.id,
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt || "",
        content: d.content || "",
        featured_image: d.featured_image || "",
        video_url: d.video_url || "",
        category: d.category,
        tags: d.tags || [],
        status: d.status as "draft" | "published" | "scheduled" | "archived",
        meta_title: d.meta_title || "",
        meta_description: d.meta_description || "",
        read_time: d.read_time || "5 min read",
        author_name: d.author_name,
        scheduled_publish_at: d.scheduled_publish_at,
      });
      setTagsInput((d.tags || []).join(", "));
      if (d.scheduled_publish_at) {
        setScheduleDate(d.scheduled_publish_at.slice(0, 16));
      }
    }
    setIsLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100)
      .replace(/-+$/, '');
  };

  const handleTitleChange = (title: string) => {
    setPost(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(",").map(tag => tag.trim()).filter(Boolean);
    setPost(prev => ({ ...prev, tags }));
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, "");
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleContentChange = (content: string) => {
    setPost(prev => ({
      ...prev,
      content,
      read_time: calculateReadTime(content),
    }));
  };

  const savePost = async (status?: "draft" | "published" | "scheduled" | "archived", scheduledAt?: string) => {
    if (!supabase || typeof supabase.from !== 'function') return;
    if (!post.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    
    const postData: any = {
      title: post.title,
      slug: post.slug || generateSlug(post.title),
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      category: post.category,
      tags: post.tags,
      status: status || post.status,
      meta_title: post.meta_title || post.title,
      meta_description: post.meta_description || post.excerpt,
      read_time: post.read_time,
      author_name: post.author_name,
      published_at: status === "published" ? new Date().toISOString() : undefined,
      scheduled_publish_at: status === "scheduled" && scheduledAt 
        ? new Date(scheduledAt).toISOString() 
        : (status === "scheduled" ? post.scheduled_publish_at : null),
    };

    try {
      if (postId) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", postId);

        if (error) throw error;
        toast.success(status === "scheduled" 
          ? `Post scheduled for ${format(new Date(scheduledAt!), "PPp")}`
          : "Post updated successfully!");
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([postData]);

        if (error) throw error;
        toast.success(status === "scheduled"
          ? `Post scheduled for ${format(new Date(scheduledAt!), "PPp")}`
          : "Post created successfully!");
        onBack();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = () => {
    if (!scheduleDate) {
      toast.error("Please select a date and time");
      return;
    }
    savePost("scheduled", scheduleDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {postId ? "Edit Post" : "New Post"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {post.status === "draft" ? "Draft" : post.status === "scheduled" ? "Scheduled" : "Published"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkingTool(!showLinkingTool)}
            className={showLinkingTool ? "bg-primary/10" : ""}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Internal Links
          </Button>
          <Button
            variant="outline"
            onClick={() => savePost("draft")}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          {postId && post.status !== "archived" && (
            <Button
              variant="outline"
              onClick={() => savePost("archived")}
              disabled={isSaving}
              className="text-destructive hover:bg-destructive/10"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={isSaving}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSchedule}
                  disabled={!scheduleDate || isSaving}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Post
                </Button>
                {post.scheduled_publish_at && (
                  <p className="text-xs text-muted-foreground text-center">
                    Currently scheduled: {format(new Date(post.scheduled_publish_at), "PPp")}
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            onClick={() => savePost("published")}
            disabled={isSaving}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={post.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={post.slug}
                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <Tabs defaultValue="visual">
              <TabsList className="mb-4">
                <TabsTrigger value="visual">
                  <FileText className="h-4 w-4 mr-2" />
                  Visual Editor
                </TabsTrigger>
                <TabsTrigger value="html">
                  <Code className="h-4 w-4 mr-2" />
                  HTML
                </TabsTrigger>
                <TabsTrigger value="excerpt">
                  <FileText className="h-4 w-4 mr-2" />
                  Excerpt
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="mt-0">
                <RichTextEditor
                  content={post.content}
                  onChange={handleContentChange}
                  placeholder="Write your article content here..."
                />
              </TabsContent>

              <TabsContent value="html" className="mt-0">
                <div className="space-y-2">
                  <Textarea
                    placeholder="<p>Write your HTML content here...</p>"
                    value={post.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="font-mono text-sm min-h-[400px] bg-muted/30"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    Write or paste HTML code directly. Changes sync with Visual Editor.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="excerpt" className="mt-0">
                <Textarea
                  placeholder="Write a short excerpt for the post..."
                  value={post.excerpt}
                  onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This will be shown in blog listings and search results.
                </p>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          {showLinkingTool && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <InternalLinkingTool
                currentPostId={postId}
                onInsertLink={(url, title) => {
                  const selection = window.getSelection();
                  const selectedText = selection?.toString() || title;
                  const link = `<a href="${url}" title="${title}">${selectedText}</a>`;
                  if (selection && selection.toString()) {
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied! Paste it in your content where needed.");
                  } else {
                    setPost(prev => ({
                      ...prev,
                      content: prev.content + ` ${link}`
                    }));
                    toast.success("Link added to content!");
                  }
                }}
              />
            </motion.div>
          )}

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Label>Featured Image</Label>
              </div>
              
              {post.featured_image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={post.featured_image}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setPost(prev => ({ ...prev, featured_image: "" }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <p className="text-sm text-muted-foreground">No image selected</p>
                </div>
              )}
              
              <Input
                placeholder="Enter image URL..."
                value={post.featured_image}
                onChange={(e) => setPost(prev => ({ ...prev, featured_image: e.target.value }))}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <Label>فيديو YouTube</Label>
              </div>
              
              {post.video_url ? (
                <div className="space-y-3">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(post.video_url)}`}
                      className="w-full h-full"
                      allowFullScreen
                      title="YouTube video preview"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setPost(prev => ({ ...prev, video_url: "" }))}
                  >
                    إزالة الفيديو
                  </Button>
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <div className="text-center">
                    <Youtube className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">لم يتم إضافة فيديو</p>
                  </div>
                </div>
              )}
              
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={post.video_url}
                onChange={(e) => setPost(prev => ({ ...prev, video_url: e.target.value }))}
                dir="ltr"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={post.category}
                  onValueChange={(value) => setPost(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Label>Tags</Label>
                </div>
                <Input
                  placeholder="design, tutorial, tips (comma separated)"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <Label>SEO Settings</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-title" className="text-xs text-muted-foreground">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="SEO title (60 chars max)"
                  value={post.meta_title}
                  onChange={(e) => setPost(prev => ({ ...prev, meta_title: e.target.value }))}
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-desc" className="text-xs text-muted-foreground">Meta Description</Label>
                <Textarea
                  id="meta-desc"
                  placeholder="SEO description (160 chars max)"
                  value={post.meta_description}
                  onChange={(e) => setPost(prev => ({ ...prev, meta_description: e.target.value }))}
                  maxLength={160}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-xs text-muted-foreground">Author Name</Label>
                <Input
                  id="author"
                  placeholder="Author name"
                  value={post.author_name}
                  onChange={(e) => setPost(prev => ({ ...prev, author_name: e.target.value }))}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
