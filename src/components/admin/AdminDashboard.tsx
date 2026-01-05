import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Image, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Users,
  BarChart3,
  Star,
  Download,
  RefreshCw,
  ExternalLink,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "./AuthPage";
import { BlogPostsList } from "./BlogPostsList";
import { BlogPostEditor } from "./BlogPostEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type View = "dashboard" | "posts" | "designs" | "settings" | "edit-post";

interface Design {
  id: string;
  name: string;
  image_url: string;
  category: string;
  featured: boolean;
  source: string | null;
  teepublic_url: string | null;
  redbubble_url: string | null;
}

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalDesigns: number;
  featuredDesigns: number;
}

export function AdminDashboard() {
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalDesigns: 0,
    featuredDesigns: 0,
  });
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      fetchDesigns();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    const [postsResult, designsResult] = await Promise.all([
      supabase.from("blog_posts").select("status"),
      supabase.from("designs").select("featured"),
    ]);

    const posts = postsResult.data || [];
    const designsData = designsResult.data || [];

    setStats({
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => p.status === "published").length,
      draftPosts: posts.filter(p => p.status === "draft").length,
      totalDesigns: designsData.length,
      featuredDesigns: designsData.filter(d => d.featured).length,
    });
  };

  const fetchDesigns = async () => {
    setIsLoadingDesigns(true);
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDesigns(data);
    }
    setIsLoadingDesigns(false);
  };

  const importFromStore = async (source: "redbubble" | "teepublic") => {
    setIsImporting(source);
    
    const storeUrls = {
      redbubble: "https://www.redbubble.com/people/rengone/shop",
      teepublic: "https://www.teepublic.com/user/bankacem"
    };

    try {
      const { data, error } = await supabase.functions.invoke("import-designs", {
        body: { storeUrl: storeUrls[source], source }
      });

      if (error) throw new Error(error.message);
      
      if (data.success) {
        toast.success(`Imported ${data.designs} designs from ${source === "redbubble" ? "Redbubble" : "TeePublic"}!`);
        fetchDesigns();
        fetchStats();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(null);
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    const { error } = await supabase
      .from("designs")
      .update({ featured: !featured })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update design");
    } else {
      setDesigns(designs.map(d => 
        d.id === id ? { ...d, featured: !featured } : d
      ));
      fetchStats();
      toast.success(featured ? "Removed from featured" : "Added to featured");
    }
  };

  const deleteDesign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    const { error } = await supabase
      .from("designs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete design");
    } else {
      setDesigns(designs.filter(d => d.id !== id));
      fetchStats();
      toast.success("Design deleted");
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
  };

  const handleEditPost = (id: string) => {
    setEditingPostId(id);
    setCurrentView("edit-post");
  };

  const handleNewPost = () => {
    setEditingPostId(null);
    setCurrentView("edit-post");
  };

  const handleBackFromEditor = () => {
    setEditingPostId(null);
    setCurrentView("posts");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Please contact the administrator.
          </p>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "posts", label: "Blog Posts", icon: FileText },
    { id: "designs", label: "Designs", icon: Image },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 h-screen w-64 bg-background border-r border-border z-50 transition-transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Content Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || 
                (currentView === "edit-post" && item.id === "posts");
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-foreground">Admin Panel</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                <p className="text-muted-foreground">Welcome back! Here's an overview.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.totalPosts}</p>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.publishedPosts}</p>
                      <p className="text-sm text-muted-foreground">Published</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Image className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.totalDesigns}</p>
                      <p className="text-sm text-muted-foreground">Designs</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stats.featuredDesigns}</p>
                      <p className="text-sm text-muted-foreground">Featured</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleNewPost}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create New Post
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setCurrentView("designs")}
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Manage Designs
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.draftPosts} draft posts waiting to be published
                  </p>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Posts View */}
          {currentView === "posts" && (
            <BlogPostsList 
              onNewPost={handleNewPost}
              onEditPost={handleEditPost}
            />
          )}

          {/* Edit Post View */}
          {currentView === "edit-post" && (
            <BlogPostEditor 
              postId={editingPostId || undefined}
              onBack={handleBackFromEditor}
            />
          )}

          {/* Designs View */}
          {currentView === "designs" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">Designs</h2>
                <p className="text-muted-foreground">Manage your design library</p>
              </div>

              {/* Import Section */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Import Designs</h3>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => importFromStore("redbubble")}
                    disabled={isImporting !== null}
                    variant="outline"
                  >
                    {isImporting === "redbubble" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Import from Redbubble
                  </Button>
                  <Button
                    onClick={() => importFromStore("teepublic")}
                    disabled={isImporting !== null}
                    variant="outline"
                  >
                    {isImporting === "teepublic" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Import from TeePublic
                  </Button>
                  <Button onClick={fetchDesigns} variant="ghost" size="icon">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Designs Grid */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  All Designs ({designs.length})
                </h3>
                
                {isLoadingDesigns ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Loading designs...
                  </div>
                ) : designs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No designs yet. Import designs from your stores.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {designs.map((design, index) => (
                      <motion.div
                        key={design.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group relative rounded-xl overflow-hidden border border-border bg-card"
                      >
                        <div className="aspect-square bg-secondary">
                          <img
                            src={design.image_url}
                            alt={design.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=No+Image";
                            }}
                          />
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => toggleFeatured(design.id, design.featured)}
                            >
                              <Star className={`w-4 h-4 ${design.featured ? "fill-amber-500 text-amber-500" : ""}`} />
                            </Button>
                            {(design.teepublic_url || design.redbubble_url) && (
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                asChild
                              >
                                <a
                                  href={design.teepublic_url || design.redbubble_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => deleteDesign(design.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Featured badge */}
                        {design.featured && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Featured
                          </div>
                        )}

                        {/* Info */}
                        <div className="p-3">
                          <h4 className="font-medium text-sm text-foreground line-clamp-1">
                            {design.name}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">{design.category}</span>
                            {design.source && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                design.source === "redbubble" 
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" 
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}>
                                {design.source}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Settings View */}
          {currentView === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-foreground">Settings</h2>
                <p className="text-muted-foreground">Manage your admin settings</p>
              </div>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Account</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium text-foreground">Administrator</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
