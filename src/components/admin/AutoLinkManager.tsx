import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutoLinkKeyword {
  id: string;
  keyword: string;
  target_post_id: string;
  priority: number;
  is_active: boolean;
  post_title?: string;
  post_slug?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
}

export function AutoLinkManager() {
  const [keywords, setKeywords] = useState<AutoLinkKeyword[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newTargetPostId, setNewTargetPostId] = useState("");
  const [newPriority, setNewPriority] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch posts
    const { data: postsData } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .eq("status", "published")
      .order("title");

    if (postsData) {
      setPosts(postsData);
    }

    // Fetch keywords with post details
    const { data: keywordsData } = await supabase
      .from("auto_link_keywords")
      .select("*")
      .order("priority", { ascending: false });

    if (keywordsData && postsData) {
      const postsMap = new Map(postsData.map(p => [p.id, p]));
      const enrichedKeywords = keywordsData.map(k => ({
        ...k,
        post_title: (postsMap.get(k.target_post_id) as any)?.title,
        post_slug: (postsMap.get(k.target_post_id) as any)?.slug,
      }));
      setKeywords(enrichedKeywords);
    }

    setIsLoading(false);
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !newTargetPostId) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from("auto_link_keywords").insert({
      keyword: newKeyword.trim().toLowerCase(),
      target_post_id: newTargetPostId,
      priority: newPriority,
      is_active: true,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("This keyword already exists for this post");
      } else {
        toast.error("Failed to add keyword");
      }
    } else {
      toast.success("Keyword added!");
      setShowAddDialog(false);
      setNewKeyword("");
      setNewTargetPostId("");
      setNewPriority(1);
      fetchData();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("auto_link_keywords")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (!error) {
      setKeywords(prev =>
        prev.map(k => (k.id === id ? { ...k, is_active: !isActive } : k))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("auto_link_keywords")
      .delete()
      .eq("id", id);

    if (!error) {
      setKeywords(prev => prev.filter(k => k.id !== id));
      toast.success("Keyword deleted");
    }
  };

  const handleGenerateFromPosts = async () => {
    setIsGenerating(true);

    try {
      for (const post of posts) {
        // Extract keywords from title
        const words = post.title.split(/\s+/).filter(w => w.length > 4);
        
        for (const word of words) {
          await supabase.from("auto_link_keywords").upsert({
            keyword: word.toLowerCase().replace(/[^a-z0-9]/g, ""),
            target_post_id: post.id,
            priority: 1,
            is_active: true,
          }, {
            onConflict: "keyword,target_post_id",
          });
        }

        // Also add 2-word phrases
        const titleWords = post.title.split(/\s+/);
        for (let i = 0; i < titleWords.length - 1; i++) {
          const phrase = titleWords.slice(i, i + 2).join(" ").toLowerCase();
          if (phrase.length > 5) {
            await supabase.from("auto_link_keywords").upsert({
              keyword: phrase,
              target_post_id: post.id,
              priority: 2,
              is_active: true,
            }, {
              onConflict: "keyword,target_post_id",
            });
          }
        }
      }

      toast.success("Keywords generated from all posts!");
      fetchData();
    } catch (error) {
      toast.error("Failed to generate keywords");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.post_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Auto-Link Keywords
          </h2>
          <p className="text-sm text-muted-foreground">
            Automatically link keywords in articles to related posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateFromPosts}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate from Posts
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Keywords List */}
      <Card className="p-6">
        <div className="space-y-3">
          {filteredKeywords.map((keyword) => (
            <div
              key={keyword.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Switch
                  checked={keyword.is_active}
                  onCheckedChange={() => handleToggleActive(keyword.id, keyword.is_active)}
                />
                <div className="min-w-0">
                  <p className="font-medium">{keyword.keyword}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    → {keyword.post_title || "Unknown post"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Priority: {keyword.priority}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(keyword.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {filteredKeywords.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No keywords found. Add some or generate from posts.
            </p>
          )}
        </div>
      </Card>

      {/* Add Keyword Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Auto-Link Keyword</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input
                placeholder="Enter keyword or phrase..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Post</Label>
              <Select value={newTargetPostId} onValueChange={setNewTargetPostId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a post..." />
                </SelectTrigger>
                <SelectContent>
                  {posts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority (higher = more important)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={newPriority}
                onChange={(e) => setNewPriority(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKeyword}>
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
