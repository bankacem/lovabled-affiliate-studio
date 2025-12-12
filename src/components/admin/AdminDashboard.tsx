import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Download, 
  Image, 
  Star, 
  Trash2, 
  LogOut,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLogin } from "./AdminLogin";

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

interface ImportResult {
  success: boolean;
  message?: string;
  designs?: number;
  error?: string;
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDesigns();
    }
  }, [isAuthenticated]);

  const fetchDesigns = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("فشل في تحميل التصاميم");
    } else {
      setDesigns(data || []);
    }
    setIsLoading(false);
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
        toast.success(`تم استيراد ${data.designs} تصميم من ${source === "redbubble" ? "Redbubble" : "TeePublic"}!`);
        fetchDesigns();
      } else {
        toast.error(data.error || "فشل الاستيراد");
      }
    } catch (error: any) {
      toast.error(`فشل الاستيراد: ${error.message}`);
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
      toast.error("فشل في تحديث التصميم");
    } else {
      setDesigns(designs.map(d => 
        d.id === id ? { ...d, featured: !featured } : d
      ));
      toast.success(featured ? "تم إزالة من المميزة" : "تم إضافة للمميزة");
    }
  };

  const deleteDesign = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التصميم؟")) return;

    const { error } = await supabase
      .from("designs")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("فشل في حذف التصميم");
    } else {
      setDesigns(designs.filter(d => d.id !== id));
      toast.success("تم حذف التصميم");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-xs text-muted-foreground">إدارة التصاميم</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            خروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{designs.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي التصاميم</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {designs.filter(d => d.featured).length}
                </p>
                <p className="text-sm text-muted-foreground">تصاميم مميزة</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {designs.filter(d => d.source).length}
                </p>
                <p className="text-sm text-muted-foreground">تصاميم مستوردة</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Import Section */}
        <Card className="p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            استيراد التصاميم
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => importFromStore("redbubble")}
              disabled={isImporting !== null}
              variant="outline"
              className="border-red-200 hover:bg-red-50"
            >
              {isImporting === "redbubble" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              استيراد من Redbubble
            </Button>
            <Button
              onClick={() => importFromStore("teepublic")}
              disabled={isImporting !== null}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50"
            >
              {isImporting === "teepublic" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              استيراد من TeePublic
            </Button>
            <Button onClick={fetchDesigns} variant="ghost" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Designs Grid */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            التصاميم ({designs.length})
          </h2>
          
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : designs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد تصاميم حتى الآن. قم باستيراد التصاميم من متاجرك.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {designs.map((design, index) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
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
                      مميز
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-foreground line-clamp-1">
                      {design.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{design.category}</span>
                      {design.source && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          design.source === "redbubble" 
                            ? "bg-red-100 text-red-600" 
                            : "bg-blue-100 text-blue-600"
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
      </main>
    </div>
  );
}
