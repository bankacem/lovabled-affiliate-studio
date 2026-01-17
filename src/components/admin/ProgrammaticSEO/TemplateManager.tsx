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
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react";
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
  { value: "birthday", label: "أعياد الميلاد (Birthday)" },
  { value: "anniversary", label: "المناسبات (Anniversary)" },
  { value: "profession", label: "المهن (Profession)" },
  { value: "location", label: "المدن (Location)" },
  { value: "hobby", label: "الهوايات (Hobby)" },
];

const defaultTemplate: Partial<ArticleTemplate> = {
  name: "",
  description: "",
  template_type: "birthday",
  title_template: "The Ultimate Guide to Vintage [Year] Birthday Shirts",
  slug_template: "p-vintage-birthday-shirts-[year]-guide",
  content_template: `# Why Being Born in [Year] is a Fashion Statement

In the world of custom apparel, nothing hits quite like the year you were born. A **vintage [year] birthday shirt** isn't just clothing; it's a badge of honor.

## Our Quality Promise

Whether it's a **custom order** for a gift or for yourself, our **quality prints** ensure the [year] graphic stays vibrant. We use premium cotton to match the high standards of the [year] generation.

## Available Products

- T-Shirts
- Hoodies
- Mugs
- Phone Cases

Shop now and celebrate your vintage year!`,
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
      toast.error("فشل في تحميل القوالب");
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.title_template || !formData.slug_template || !formData.content_template) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Validate slug starts with 'p-'
    if (!formData.slug_template?.startsWith("p-")) {
      toast.error("يجب أن يبدأ الـ Slug بـ 'p-' للمقالات البرمجية");
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
        toast.success("تم تحديث القالب بنجاح");
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
        toast.success("تم إنشاء القالب بنجاح");
      }

      setIsDialogOpen(false);
      setEditingTemplate(null);
      setFormData(defaultTemplate);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القالب؟")) return;

    const { error } = await supabase
      .from("article_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("فشل في حذف القالب");
    } else {
      toast.success("تم حذف القالب");
      fetchTemplates();
    }
  };

  const openEditDialog = (template: ArticleTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setFormData(defaultTemplate);
    setIsDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">قوالب المقالات</h2>
          <p className="text-muted-foreground">إدارة قوالب Programmatic SEO للتوليد الآلي</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              قالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}</DialogTitle>
              <DialogDescription>
                استخدم المتغيرات مثل [Year], [Age], [City] في القوالب
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم القالب *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Birthday Vintage Template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">نوع القالب</Label>
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
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف القالب</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للقالب"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title_template">قالب العنوان *</Label>
                <Input
                  id="title_template"
                  value={formData.title_template || ""}
                  onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                  placeholder="The Ultimate Guide to Vintage [Year] Birthday Shirts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug_template">قالب الرابط * (يجب أن يبدأ بـ p-)</Label>
                <Input
                  id="slug_template"
                  value={formData.slug_template || ""}
                  onChange={(e) => setFormData({ ...formData, slug_template: e.target.value })}
                  placeholder="p-vintage-birthday-shirts-[year]-guide"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt_template">قالب المقتطف</Label>
                <Textarea
                  id="excerpt_template"
                  value={formData.excerpt_template || ""}
                  onChange={(e) => setFormData({ ...formData, excerpt_template: e.target.value })}
                  placeholder="مقتطف المقال مع المتغيرات"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_template">قالب المحتوى *</Label>
                <Textarea
                  id="content_template"
                  value={formData.content_template || ""}
                  onChange={(e) => setFormData({ ...formData, content_template: e.target.value })}
                  placeholder="محتوى المقال مع المتغيرات"
                  className="min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">الفئة</Label>
                  <Input
                    id="category"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Birthday"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">الوسوم (مفصولة بفاصلة)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()) })}
                    placeholder="vintage, birthday, custom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title_template">Meta Title Template</Label>
                <Input
                  id="meta_title_template"
                  value={formData.meta_title_template || ""}
                  onChange={(e) => setFormData({ ...formData, meta_title_template: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description_template">Meta Description Template</Label>
                <Textarea
                  id="meta_description_template"
                  value={formData.meta_description_template || ""}
                  onChange={(e) => setFormData({ ...formData, meta_description_template: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">نشط</Label>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingTemplate ? "تحديث القالب" : "إنشاء القالب"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد قوالب بعد</p>
            <Button onClick={openNewDialog} variant="outline" className="mt-4">
              إنشاء أول قالب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>النوع:</strong> {TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label}</p>
                  <p><strong>الفئة:</strong> {template.category}</p>
                  <p className="truncate"><strong>Slug:</strong> {template.slug_template}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                    <Edit className="h-4 w-4 mr-1" />
                    تعديل
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
