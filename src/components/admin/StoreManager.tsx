import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Plus, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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

type Platform = "redbubble" | "teepublic" | "amazon" | "etsy";

interface StoreProfile {
  id: string;
  name: string;
  store_url: string;
  platform: Platform;
  username: string | null;
  created_at: string;
}

interface StoreManagerProps {
  onImport: (storeUrl: string, platform: Platform) => void;
  isImporting: string | null;
}

export function StoreManager({ onImport, isImporting }: StoreManagerProps) {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [newStore, setNewStore] = useState({
    name: "",
    store_url: "",
    platform: "redbubble" as Platform,
    username: "",
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStores(data as StoreProfile[]);
    }
    setIsLoading(false);
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.store_url || !newStore.platform) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase.from("stores").insert({
      name: newStore.name,
      store_url: newStore.store_url,
      platform: newStore.platform,
      username: newStore.username || null,
      user_id: user.user.id,
    });

    if (error) {
      toast.error("Failed to add store: " + error.message);
    } else {
      toast.success("Store added successfully!");
      setNewStore({ name: "", store_url: "", platform: "redbubble", username: "" });
      setIsDialogOpen(false);
      fetchStores();
    }
  };

  const handleDeleteStore = async (id: string) => {
    const { error } = await supabase.from("stores").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete store");
    } else {
      setStores(stores.filter((s) => s.id !== id));
      toast.success("Store deleted");
    }
    setStoreToDelete(null);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "redbubble": return "text-red-500 bg-red-500/10";
      case "teepublic": return "text-blue-500 bg-blue-500/10";
      case "amazon": return "text-orange-500 bg-orange-500/10";
      case "etsy": return "text-amber-600 bg-amber-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "redbubble": return "RB";
      case "teepublic": return "TP";
      case "amazon": return "AMZ";
      case "etsy": return "ET";
      default: return "??";
    }
  };
  
  const getPlaceholderUrl = (platform: Platform) => {
    switch (platform) {
      case "redbubble": return "https://www.redbubble.com/people/username/shop";
      case "teepublic": return "https://www.teepublic.com/user/username";
      case "amazon": return "https://www.amazon.com/s?rh=n%3A7141123011%2Cp_4%3AYOUR_BRAND";
      case "etsy": return "https://www.etsy.com/shop/YOUR_SHOP_NAME";
      default: return "";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5" />
            My Stores
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your TeePublic and Redbubble stores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  placeholder="My Redbubble Store"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={newStore.platform}
                  onValueChange={(value: Platform) =>
                    setNewStore({ ...newStore, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redbubble">Redbubble</SelectItem>
                    <SelectItem value="teepublic">TeePublic</SelectItem>
                    <SelectItem value="amazon">Merch by Amazon</SelectItem>
                    <SelectItem value="etsy">Etsy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-url">Store URL</Label>
                <Input
                  id="store-url"
                  placeholder={getPlaceholderUrl(newStore.platform)}
                  value={newStore.store_url}
                  onChange={(e) => setNewStore({ ...newStore, store_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {newStore.platform === "amazon" && "Use your Merch by Amazon brand search URL"}
                  {newStore.platform === "etsy" && "Use your Etsy shop URL"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username (optional)</Label>
                <Input
                  id="username"
                  placeholder="Store username"
                  value={newStore.username}
                  onChange={(e) => setNewStore({ ...newStore, username: e.target.value })}
                />
              </div>
              <Button onClick={handleAddStore} className="w-full">
                Add Store
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading stores...</div>
      ) : stores.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No stores added yet. Add your first store to start importing designs.
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${getPlatformColor(
                  store.platform
                )}`}
              >
                {getPlatformLabel(store.platform)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{store.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {store.username || store.store_url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onImport(store.store_url, store.platform)}
                  disabled={isImporting !== null}
                >
                  {isImporting === store.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Import
                    </>
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  asChild
                >
                  <a href={store.store_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setStoreToDelete(store.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={storeToDelete !== null} onOpenChange={(open) => !open && setStoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this store?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove this store connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => storeToDelete && handleDeleteStore(storeToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
