import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Loader2, 
  Copy, 
  Eye, 
  Code, 
  Sparkles,
  CheckCircle2,
  XCircle,
  LayoutTemplate,
  Variable
} from "lucide-react";
import { toast } from "sonner";

import type { Json } from "@/integrations/supabase/types";

interface ArticleTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  title_template: string;
  slug_template: string;
  content_template: string;
  excerpt_template: string | null;
  category: string;
  tags: string[];
  meta_title_template: string | null;
  meta_description_template: string | null;
  variables: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_TYPES = [
  { value: "birthday", label: "Birthdays", icon: "🎂" },
  { value: "anniversary", label: "Anniversaries", icon: "🎉" },
  { value: "profession", label: "Professions", icon: "💼" },
  { value: "location", label: "Locations", icon: "📍" },
  { value: "hobby", label: "Hobbies", icon: "🎮" },
  { value: "product", label: "Products", icon: "🛍️" },
  { value: "comparison", label: "Comparisons", icon: "⚖️" },
  { value: "guide", label: "Guides", icon: "📚" },
];

const defaultTemplate: Partial<ArticleTemplate> = {
  name: "",
  description: "",
  template_type: "birthday",
  title_template: "The Ultimate Guide to Vintage [Year] Birthday Shirts",
  slug_template: "p-vintage-birthday-shirts-[year]-guide",
  content_template: `<h1>Why Being Born in [Year] is a Fashion Statement</h1>

<p>In the world of custom apparel, nothing hits quite like the year you were born. A <strong>vintage [year] birthday shirt</strong> isn't just clothing; it's a badge of honor.</p>

<h2>Our Quality Promise</h2>

<p>Whether it's a <strong>custom order</strong> for a gift or for yourself, our <strong>quality prints</strong> ensure the [year] graphic stays vibrant.</p>

<h2>Available Products</h2>

<ul>
  <li>T-Shirts</li>
  <li>Hoodies</li>
  <li>Mugs</li>
  <li>Phone Cases</li>
</ul>

<p>Shop now and celebrate your vintage year!</p>`,
  excerpt_template: "Discover the best vintage [year] birthday shirts for celebrating your special milestone.",
  category: "Birthday",
  tags: ["vintage", "birthday", "custom"],
  meta_title_template: "Vintage [Year] Birthday Shirts | Custom Designs",
  meta_description_template: "Shop the best vintage [year] birthday shirts. Perfect for celebrating your [age]th birthday with style.",
  variables: { year: "1990", age: "35" },
  is_active: true,
};

export function TemplateManager() {
  const [templates, setTemplates] = useState<ArticleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ArticleTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<ArticleTemplate>>(defaultTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ArticleTemplate | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("article_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load templates");
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.title_template || !formData.slug_template || !formData.content_template) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.slug_template?.startsWith("p-")) {
      toast.error("Slug must start with 'p-' for programmatic articles");
      return;
    }

    setIsSaving(true);

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("article_templates")
          .update({
            name: formData.name,
            description: formData.description,
            template_type: formData.template_type,
            title_template: formData.title_template,
            slug_template: formData.slug_template,
            content_template: formData.content_template,
            excerpt_template: formData.excerpt_template,
            category: formData.category,
            tags: formData.tags,
            meta_title_template: formData.meta_title_template,
            meta_description_template: formData.meta_description_template,
            variables: formData.variables,
            is_active: formData.is_active,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        const { error } = await supabase
          .from("article_templates")
          .insert([{
            name: formData.name,
            description: formData.description,
            template_type: formData.template_type,
            title_template: formData.title_template,
            slug_template: formData.slug_template,
            content_template: formData.content_template,
            excerpt_template: formData.excerpt_template,
            category: formData.category,
            tags: formData.tags,
            meta_title_template: formData.meta_title_template,
            meta_description_template: formData.meta_description_template,
            variables: formData.variables,
            is_active: formData.is_active,
          }]);

        if (error) throw error;
        toast.success("Template created successfully");
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData(defaultTemplate);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("Error saving template");
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    const { error } = await supabase
      .from("article_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      fetchTemplates();
    }
  };

  const handleDuplicate = async (template: ArticleTemplate) => {
    const { error } = await supabase
      .from("article_templates")
      .insert([{
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        title_template: template.title_template,
        slug_template: template.slug_template,
        content_template: template.content_template,
        excerpt_template: template.excerpt_template,
        category: template.category,
        tags: template.tags,
        meta_title_template: template.meta_title_template,
        meta_description_template: template.meta_description_template,
        variables: template.variables,
        is_active: false,
      }]);

    if (error) {
      toast.error("Failed to duplicate template");
    } else {
      toast.success("Template duplicated");
      fetchTemplates();
    }
  };

  const openEditDialog = (template: ArticleTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsDialogOpen(true);
    setActiveTab("basic");
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setFormData(defaultTemplate);
    setIsDialogOpen(true);
    setActiveTab("basic");
  };

  const getTypeInfo = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type) || { value: type, label: type, icon: "📄" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            Article Templates
          </h2>
          <p className="text-muted-foreground">Manage Programmatic SEO templates for batch generation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingTemplate ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
              <DialogDescription>
                Use variables like [Year], [Age], [City] in your templates
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO Settings</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(90vh-220px)] mt-4">
                <TabsContent value="basic" className="space-y-4 pr-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Birthday Vintage Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Template Type</Label>
                      <Select
                        value={formData.template_type}
                        onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the template"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title_template">Title Template *</Label>
                    <Input
                      id="title_template"
                      value={formData.title_template || ""}
                      onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                      placeholder="The Ultimate Guide to Vintage [Year] Birthday Shirts"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug_template">Slug Template * (must start with p-)</Label>
                    <Input
                      id="slug_template"
                      value={formData.slug_template || ""}
                      onChange={(e) => setFormData({ ...formData, slug_template: e.target.value })}
                      placeholder="p-vintage-birthday-shirts-[year]-guide"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Birthday"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags?.join(", ") || ""}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()) })}
                        placeholder="vintage, birthday, custom"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="is_active" className="cursor-pointer">Active Template</Label>
                    </div>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="excerpt_template">Excerpt Template</Label>
                    <Textarea
                      id="excerpt_template"
                      value={formData.excerpt_template || ""}
                      onChange={(e) => setFormData({ ...formData, excerpt_template: e.target.value })}
                      placeholder="Article excerpt with variables"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content_template">Content Template * (HTML)</Label>
                      <Badge variant="outline" className="text-xs">
                        <Code className="h-3 w-3 mr-1" />
                        HTML Supported
                      </Badge>
                    </div>
                    <Textarea
                      id="content_template"
                      value={formData.content_template || ""}
                      onChange={(e) => setFormData({ ...formData, content_template: e.target.value })}
                      placeholder="Article content with HTML and variables"
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Variable className="h-4 w-4" />
                      Available Variables
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["[Year]", "[Age]", "[City]", "[Profession]", "[Product]", "[Category]"].map(v => (
                        <Badge key={v} variant="secondary" className="font-mono text-xs">{v}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title_template">Meta Title Template</Label>
                    <Input
                      id="meta_title_template"
                      value={formData.meta_title_template || ""}
                      onChange={(e) => setFormData({ ...formData, meta_title_template: e.target.value })}
                      placeholder="Vintage [Year] Birthday Shirts | Custom Designs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 50-60 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description_template">Meta Description Template</Label>
                    <Textarea
                      id="meta_description_template"
                      value={formData.meta_description_template || ""}
                      onChange={(e) => setFormData({ ...formData, meta_description_template: e.target.value })}
                      placeholder="Shop the best vintage [year] birthday shirts..."
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 150-160 characters
                    </p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates.filter(t => !t.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{TEMPLATE_TYPES.length}</p>
                <p className="text-xs text-muted-foreground">Template Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No templates yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first template to start generating articles</p>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const typeInfo = getTypeInfo(template.template_type);
            return (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg text-xl">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-1">{template.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs">
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Type:</span>
                      <span className="font-medium text-foreground">{typeInfo.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Category:</span>
                      <Badge variant="outline" className="font-normal">{template.category}</Badge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground font-mono">
                      /{template.slug_template}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(template)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
