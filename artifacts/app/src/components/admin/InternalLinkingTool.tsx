import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Search, Plus, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[] | null;
  excerpt: string | null;
}

interface InternalLinkingToolProps {
  currentPostId?: string;
  onInsertLink: (url: string, title: string) => void;
}

export function InternalLinkingTool({ currentPostId, onInsertLink }: InternalLinkingToolProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, tags, excerpt")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPosts(data.filter(p => p.id !== currentPostId));
    }
    setIsLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.category.toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleCopyLink = (post: BlogPost) => {
    const link = `/blog/${post.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedId(post.id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertLink = (post: BlogPost) => {
    onInsertLink(`/blog/${post.slug}`, post.title);
    toast.success("Link inserted into editor!");
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Internal Linking Tool</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Add internal links to boost SEO. Link to related articles to keep visitors on your site.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles to link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading articles...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No articles found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {post.excerpt || `/blog/${post.slug}`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleCopyLink(post)}
                      title="Copy link"
                    >
                      {copiedId === post.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleInsertLink(post)}
                      title="Insert link"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      asChild
                      title="Preview"
                    >
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          💡 <strong>SEO Tip:</strong> Add 2-5 internal links per article to improve site structure and keep visitors engaged.
        </p>
      </div>
    </Card>
  );
}
