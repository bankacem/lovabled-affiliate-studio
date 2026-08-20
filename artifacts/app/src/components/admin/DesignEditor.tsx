import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminFetch } from "@/lib/adminApi";
import { toast } from "sonner";

interface Design {
  id?: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  tags: string[];
  teepublic_url: string;
  redbubble_url: string;
  featured: boolean;
  source: string;
}

interface DesignEditorProps {
  design?: Design | null;
  onSave: () => void;
  onCancel: () => void;
}

const categories = [
  "T-Shirts",
  "Hoodies",
  "Mugs",
  "Stickers",
  "Phone Cases",
  "Posters",
  "Bags",
];

export function DesignEditor({ design, onSave, onCancel }: DesignEditorProps) {
  const [formData, setFormData] = useState<Design>({
    name: "",
    description: "",
    image_url: "",
    category: "T-Shirts",
    tags: [],
    teepublic_url: "",
    redbubble_url: "",
    featured: false,
    source: "manual",
  });
  const [tagsInput, setTagsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (design) {
      setFormData({
        ...design,
        description: design.description || "",
        teepublic_url: design.teepublic_url || "",
        redbubble_url: design.redbubble_url || "",
        source: design.source || "manual",
      });
      setTagsInput((design.tags || []).join(", "));
    }
  }, [design]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.image_url) {
      toast.error("Name and image URL are required");
      return;
    }

    setIsSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const dataToSave = {
      name: formData.name,
      description: formData.description || null,
      image_url: formData.image_url,
      category: formData.category,
      tags,
      teepublic_url: formData.teepublic_url || null,
      redbubble_url: formData.redbubble_url || null,
      featured: formData.featured,
      source: formData.source || "manual",
    };

    try {
      if (design?.id) {
        await adminFetch(`/designs/${encodeURIComponent(design.id)}`, { method: "PATCH", body: JSON.stringify(dataToSave) });
      } else {
        await adminFetch("/designs", { method: "POST", body: JSON.stringify(dataToSave) });
      }
      toast.success(design?.id ? "Design updated!" : "Design created!");
      onSave();
    } catch (error) {
      toast.error("Failed to save design: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            {design?.id ? "Edit Design" : "Add New Design"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Design Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter design name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter design description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="funny, vintage, retro"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked })
                  }
                />
                <Label htmlFor="featured">Featured Design</Label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              {/* Image Preview */}
              <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Invalid+URL";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teepublic_url">TeePublic URL</Label>
                <Input
                  id="teepublic_url"
                  value={formData.teepublic_url}
                  onChange={(e) => setFormData({ ...formData, teepublic_url: e.target.value })}
                  placeholder="https://www.teepublic.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redbubble_url">Redbubble URL</Label>
                <Input
                  id="redbubble_url"
                  value={formData.redbubble_url}
                  onChange={(e) => setFormData({ ...formData, redbubble_url: e.target.value })}
                  placeholder="https://www.redbubble.com/..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {design?.id ? "Update Design" : "Create Design"}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
