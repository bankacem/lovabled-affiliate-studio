import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  ExternalLink,
  TrendingUp,
  MousePointerClick,
  FileText,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkData {
  id: string;
  target_url: string;
  link_text: string | null;
  link_type: string;
  click_count: number;
  source_post_id: string | null;
  source_post_title?: string;
  created_at: string;
  updated_at: string;
}

interface PostLinkStats {
  post_id: string;
  post_title: string;
  post_slug: string;
  internal_links: number;
  external_links: number;
  total_clicks: number;
}

export function LinkAnalyticsPanel() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [postStats, setPostStats] = useState<PostLinkStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "external">("all");
  const [totalStats, setTotalStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    internalLinks: 0,
    externalLinks: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      // Fetch all link tracking data
      const { data: linksData, error: linksError } = await supabase
        .from("link_tracking")
        .select("*")
        .order("click_count", { ascending: false });

      if (linksError) throw linksError;

      // Fetch blog posts for reference
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug")
        .eq("status", "published");

      const postsMap = new Map(posts?.map((p) => [p.id, p]) || []);

      // Enrich links with post info
      const enrichedLinks =
        linksData?.map((link) => ({
          ...link,
          source_post_title: link.source_post_id
            ? postsMap.get(link.source_post_id)?.title
            : null,
        })) || [];

      setLinks(enrichedLinks);

      // Calculate stats per post
      const postStatsMap = new Map<string, PostLinkStats>();

      enrichedLinks.forEach((link) => {
        if (link.source_post_id) {
          const post = postsMap.get(link.source_post_id);
          if (post) {
            const existing = postStatsMap.get(link.source_post_id) || {
              post_id: link.source_post_id,
              post_title: post.title,
              post_slug: post.slug,
              internal_links: 0,
              external_links: 0,
              total_clicks: 0,
            };

            if (link.link_type === "internal") {
              existing.internal_links += 1;
            } else {
              existing.external_links += 1;
            }
            existing.total_clicks += link.click_count;

            postStatsMap.set(link.source_post_id, existing);
          }
        }
      });

      setPostStats(Array.from(postStatsMap.values()).sort((a, b) => b.total_clicks - a.total_clicks));

      // Calculate total stats
      const internal = enrichedLinks.filter((l) => l.link_type === "internal");
      const external = enrichedLinks.filter((l) => l.link_type === "external");
      const totalClicks = enrichedLinks.reduce((sum, l) => sum + l.click_count, 0);

      setTotalStats({
        totalLinks: enrichedLinks.length,
        totalClicks,
        internalLinks: internal.length,
        externalLinks: external.length,
      });
    } catch (error) {
      console.error("Error fetching link data:", error);
      toast.error("Failed to load link analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.link_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.target_url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || link.link_type === filterType;
    return matchesSearch && matchesType;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Link Analytics</h2>
          <p className="text-muted-foreground">
            Track internal and external links across your articles
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalLinks}</p>
              <p className="text-sm text-muted-foreground">Total Links</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MousePointerClick className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalClicks}</p>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Link2 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.internalLinks}</p>
              <p className="text-sm text-muted-foreground">Internal Links</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <ExternalLink className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.externalLinks}</p>
              <p className="text-sm text-muted-foreground">External Links</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="all-links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-links">All Links</TabsTrigger>
          <TabsTrigger value="by-post">By Article</TabsTrigger>
          <TabsTrigger value="top-clicks">Top Clicked</TabsTrigger>
        </TabsList>

        <TabsContent value="all-links" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v: "all" | "internal" | "external") => setFilterType(v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Links</SelectItem>
                <SelectItem value="internal">Internal Only</SelectItem>
                <SelectItem value="external">External Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6">
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {link.link_type === "external" ? (
                      <ExternalLink className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {link.link_text || "No text"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.target_url}
                      </p>
                      {link.source_post_title && (
                        <p className="text-xs text-primary truncate">
                          From: {link.source_post_title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={link.link_type === "internal" ? "default" : "secondary"}
                    >
                      {link.link_type}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {link.click_count} clicks
                    </Badge>
                  </div>
                </div>
              ))}
              {filteredLinks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No links found. Links will appear here when visitors click on them.
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="by-post">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Links by Article
            </h3>
            <div className="space-y-3">
              {postStats.map((stat) => (
                <div
                  key={stat.post_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium line-clamp-1">{stat.post_title}</p>
                    <p className="text-xs text-muted-foreground">
                      /blog/{stat.post_slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="font-semibold text-primary">
                        {stat.internal_links}
                      </p>
                      <p className="text-xs text-muted-foreground">Internal</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-orange-500">
                        {stat.external_links}
                      </p>
                      <p className="text-xs text-muted-foreground">External</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-500">
                        {stat.total_clicks}
                      </p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                  </div>
                </div>
              ))}
              {postStats.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No article link stats yet
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="top-clicks">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Clicked Links
            </h3>
            <div className="space-y-3">
              {links.slice(0, 20).map((link, index) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    {link.link_type === "external" ? (
                      <ExternalLink className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {link.link_text || link.target_url}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.target_url}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {link.click_count} clicks
                  </Badge>
                </div>
              ))}
              {links.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No click data yet
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}