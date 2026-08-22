import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Eye, 
  Clock, 
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  categoryCounts: { [key: string]: number };
  recentPosts: Array<{ title: string; status: string; created_at: string }>;
}

export function BlogStatsOverview() {
  const [stats, setStats] = useState<BlogStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    categoryCounts: {},
    recentPosts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/blog-stats.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Failed to load Git blog stats (${response.status})`);

      const gitStats = (await response.json()) as BlogStats;
      setStats({
        totalPosts: Number(gitStats.totalPosts || 0),
        publishedPosts: Number(gitStats.publishedPosts || 0),
        draftPosts: Number(gitStats.draftPosts || 0),
        scheduledPosts: Number(gitStats.scheduledPosts || 0),
        categoryCounts: gitStats.categoryCounts || {},
        recentPosts: Array.isArray(gitStats.recentPosts) ? gitStats.recentPosts : [],
      });
    } catch (error) {
      console.error("Failed to load Git blog stats:", error);
      setStats({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        scheduledPosts: 0,
        categoryCounts: {},
        recentPosts: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Published",
      value: stats.publishedPosts,
      icon: Eye,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      label: "Drafts",
      value: stats.draftPosts,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      label: "Scheduled",
      value: stats.scheduledPosts,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-8 w-8 bg-muted rounded-lg mb-3" />
              <div className="h-6 w-12 bg-muted rounded mb-1" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2 rounded-lg ${stat.bgColor} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Categories</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.categoryCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet</p>
            ) : (
              Object.entries(stats.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, count], index) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{category}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / stats.totalPosts) * 100}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
          </div>
          
          <div className="space-y-3">
            {stats.recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              stats.recentPosts.map((post, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      post.status === "published" 
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }
                  >
                    {post.status}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
