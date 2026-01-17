import { useState, useEffect, useCallback } from "react";
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
  Database,
  Loader2,
  ScanSearch,
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
import { extractLinksFromContent } from "@/lib/seoUtils";

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

interface DiscoveredLink {
  url: string;
  text: string;
  isInternal: boolean;
  postId: string;
  postTitle: string;
  isTracked: boolean;
}

export function LinkAnalyticsPanel() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [discoveredLinks, setDiscoveredLinks] = useState<DiscoveredLink[]>([]);
  const [postStats, setPostStats] = useState<PostLinkStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "internal" | "external">("all");
  const [totalStats, setTotalStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    internalLinks: 0,
    externalLinks: 0,
    untracked: 0,
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
        .select("id, title, slug, content")
        .eq("status", "published");

      const postsMap = new Map(posts?.map((p) => [p.id, p]) || []);
      const trackedUrls = new Set(linksData?.map(l => `${l.target_url}|${l.source_post_id}`) || []);

      // Enrich links with post info
      const enrichedLinks =
        linksData?.map((link) => ({
          ...link,
          source_post_title: link.source_post_id
            ? postsMap.get(link.source_post_id)?.title
            : null,
        })) || [];

      setLinks(enrichedLinks);

      // Discover all links from article content (Link Inventory)
      const allDiscovered: DiscoveredLink[] = [];
      posts?.forEach(post => {
        if (post.content) {
          const extracted = extractLinksFromContent(post.content);
          extracted.forEach(link => {
            const trackKey = `${link.url}|${post.id}`;
            allDiscovered.push({
              url: link.url,
              text: link.text,
              isInternal: link.isInternal,
              postId: post.id,
              postTitle: post.title,
              isTracked: trackedUrls.has(trackKey),
            });
          });
        }
      });

      setDiscoveredLinks(allDiscovered);

      // Calculate stats per post
      const postStatsMap = new Map<string, PostLinkStats>();

      // Include discovered links in stats
      allDiscovered.forEach((link) => {
        const post = postsMap.get(link.postId);
        if (post) {
          const existing = postStatsMap.get(link.postId) || {
            post_id: link.postId,
            post_title: post.title,
            post_slug: post.slug,
            internal_links: 0,
            external_links: 0,
            total_clicks: 0,
          };

          if (link.isInternal) {
            existing.internal_links += 1;
          } else {
            existing.external_links += 1;
          }

          postStatsMap.set(link.postId, existing);
        }
      });

      // Add click counts from tracking
      enrichedLinks.forEach((link) => {
        if (link.source_post_id && postStatsMap.has(link.source_post_id)) {
          const existing = postStatsMap.get(link.source_post_id)!;
          existing.total_clicks += link.click_count;
          postStatsMap.set(link.source_post_id, existing);
        }
      });

      setPostStats(Array.from(postStatsMap.values()).sort((a, b) => 
        (b.internal_links + b.external_links) - (a.internal_links + a.external_links)
      ));

      // Calculate total stats
      const internal = allDiscovered.filter((l) => l.isInternal);
      const external = allDiscovered.filter((l) => !l.isInternal);
      const totalClicks = enrichedLinks.reduce((sum, l) => sum + l.click_count, 0);
      const untracked = allDiscovered.filter(l => !l.isTracked).length;

      setTotalStats({
        totalLinks: allDiscovered.length,
        totalClicks,
        internalLinks: internal.length,
        externalLinks: external.length,
        untracked,
      });
    } catch (error) {
      console.error("Error fetching link data:", error);
      toast.error("Failed to load link analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const scanAndIndexLinks = useCallback(async () => {
    setIsScanning(true);
    
    try {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, content")
        .eq("status", "published");

      let indexed = 0;
      
      for (const post of posts || []) {
        if (!post.content) continue;
        
        const links = extractLinksFromContent(post.content);
        for (const link of links) {
          const { error } = await supabase
            .from("link_tracking")
            .upsert({
              target_url: link.url,
              link_text: link.text || null,
              link_type: link.isInternal ? "internal" : "external",
              source_post_id: post.id,
              click_count: 0,
            }, {
              onConflict: "target_url,source_post_id",
              ignoreDuplicates: true,
            });

          if (!error) indexed++;
        }
      }

      toast.success(`Indexed ${indexed} links from all articles!`);
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to scan links: " + error.message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const filteredDiscoveredLinks = discoveredLinks.filter((link) => {
    const matchesSearch =
      link.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.postTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || 
      (filterType === "internal" && link.isInternal) ||
      (filterType === "external" && !link.isInternal);
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={scanAndIndexLinks}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4 mr-2" />
            )}
            Scan All Articles
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.totalLinks}</p>
              <p className="text-sm text-muted-foreground">Link Inventory</p>
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

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <ScanSearch className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStats.untracked}</p>
              <p className="text-sm text-muted-foreground">Untracked</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Link Inventory</TabsTrigger>
          <TabsTrigger value="by-post">By Article</TabsTrigger>
          <TabsTrigger value="top-clicks">Top Clicked</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links or articles..."
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                All Links in Articles ({filteredDiscoveredLinks.length})
              </h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredDiscoveredLinks.map((link, index) => (
                <div
                  key={`${link.postId}-${link.url}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {!link.isInternal ? (
                      <ExternalLink className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {link.text || "No anchor text"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.url}
                      </p>
                      <p className="text-xs text-primary truncate">
                        From: {link.postTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={link.isInternal ? "default" : "secondary"}
                    >
                      {link.isInternal ? "internal" : "external"}
                    </Badge>
                    {link.isTracked ? (
                      <Badge variant="outline" className="text-green-600">
                        Tracked
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        Not tracked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {filteredDiscoveredLinks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No links found in articles. Add links to your content to see them here.
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
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {links.slice(0, 50).map((link, index) => (
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
                  No click data yet. Links will appear here after visitors click them.
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}