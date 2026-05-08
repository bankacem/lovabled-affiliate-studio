import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  MousePointerClick,
  Link2,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

interface PageViewStats {
  total_views: number;
  unique_sessions: number;
  today_views: number;
  top_pages: { page_path: string; count: number }[];
}

interface LinkStats {
  total_links: number;
  internal_links: number;
  external_links: number;
  total_clicks: number;
  top_links: { target_url: string; link_text: string; click_count: number; link_type: string }[];
}

interface PostViewStats {
  post_title: string;
  post_slug: string;
  view_count: number;
}

export function AnalyticsDashboard() {
  const [pageStats, setPageStats] = useState<PageViewStats | null>(null);
  const [linkStats, setLinkStats] = useState<LinkStats | null>(null);
  const [postStats, setPostStats] = useState<PostViewStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);

    try {
      // Fetch page view stats
      const { data: pageViews } = await supabase
        .from("page_views")
        .select("*");

      const { data: todayViews } = await supabase
        .from("page_views")
        .select("*")
        .gte("created_at", startOfDay(new Date()).toISOString());

      // Calculate unique sessions
      const uniqueSessions = new Set(pageViews?.map(v => v.session_id) || []).size;

      // Top pages
      const pageCount: Record<string, number> = {};
      pageViews?.forEach(v => {
        pageCount[v.page_path] = (pageCount[v.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page_path, count]) => ({ page_path, count }));

      setPageStats({
        total_views: pageViews?.length || 0,
        unique_sessions: uniqueSessions,
        today_views: todayViews?.length || 0,
        top_pages: topPages,
      });

      // Fetch link stats
      const { data: links } = await supabase
        .from("link_tracking")
        .select("*")
        .order("click_count", { ascending: false });

      const internalLinks = links?.filter(l => l.link_type === "internal") || [];
      const externalLinks = links?.filter(l => l.link_type === "external") || [];
      const totalClicks = links?.reduce((sum, l) => sum + l.click_count, 0) || 0;

      setLinkStats({
        total_links: links?.length || 0,
        internal_links: internalLinks.length,
        external_links: externalLinks.length,
        total_clicks: totalClicks,
        top_links: (links || []).slice(0, 10).map(l => ({
          target_url: l.target_url,
          link_text: l.link_text || "",
          click_count: l.click_count,
          link_type: l.link_type,
        })),
      });

      // Fetch post view stats
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("title, slug, view_count")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(10);

      setPostStats(posts?.map(p => ({
        post_title: p.title,
        post_slug: p.slug,
        view_count: p.view_count || 0,
      })) || []);

    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pageStats?.total_views || 0}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pageStats?.unique_sessions || 0}</p>
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pageStats?.today_views || 0}</p>
              <p className="text-sm text-muted-foreground">Today's Views</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <MousePointerClick className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{linkStats?.total_clicks || 0}</p>
              <p className="text-sm text-muted-foreground">Link Clicks</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="posts">Top Posts</TabsTrigger>
          <TabsTrigger value="links">Link Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Pages by Views
            </h3>
            <div className="space-y-3">
              {pageStats?.top_pages.map((page, index) => (
                <div
                  key={page.page_path}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{page.page_path}</span>
                  </div>
                  <Badge variant="secondary">{page.count} views</Badge>
                </div>
              ))}
              {(!pageStats?.top_pages || pageStats.top_pages.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  No page views recorded yet
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Posts by Views
            </h3>
            <div className="space-y-3">
              {postStats.map((post, index) => (
                <div
                  key={post.post_slug}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium line-clamp-1">{post.post_title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{post.post_slug}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{post.view_count} views</Badge>
                </div>
              ))}
              {postStats.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No post views recorded yet
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Link Tracking
              </h3>
              <div className="flex gap-2">
                <Badge variant="outline">
                  Internal: {linkStats?.internal_links || 0}
                </Badge>
                <Badge variant="outline">
                  External: {linkStats?.external_links || 0}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              {linkStats?.top_links.map((link, index) => (
                <div
                  key={link.target_url}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    {link.link_type === "external" ? (
                      <ExternalLink className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link.link_text || link.target_url}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.target_url}</p>
                    </div>
                  </div>
                  <Badge variant={link.link_type === "internal" ? "default" : "secondary"}>
                    {link.click_count} clicks
                  </Badge>
                </div>
              ))}
              {(!linkStats?.top_links || linkStats.top_links.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  No link clicks recorded yet
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
