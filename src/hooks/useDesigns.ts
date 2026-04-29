import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Design {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  tags: string[];
  teepublic_url: string | null;
  redbubble_url: string | null;
  amazon_url: string | null;
  etsy_url: string | null;
  featured: boolean;
  source: string | null;
  created_at: string;
}

// ─── Enrich design with fallback fields ───────────────────────────────────
// DATA AGNOSTIC: Implements flexible column mapping and safe defaults.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichDesign(design: any): Design {
  const safeName = design?.name || "Untitled Design";
  const safeImage = design?.image_url || design?.image || design?.imageUrl || design?.featured_image || "/placeholder-design.svg";

  return {
    id:            design?.id            || `temp-${Math.random().toString(36).substring(2, 11)}`,
    slug:          design?.slug          || design?.name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || "no-slug",
    name:          safeName,
    description:   design?.description   || design?.summary || "",
    image_url:     safeImage,
    category:      design?.category      || "General",
    tags:          Array.isArray(design?.tags) ? design.tags : [],
    teepublic_url: design?.teepublic_url || "",
    redbubble_url: design?.redbubble_url || "",
    amazon_url:    design?.amazon_url    || "",
    etsy_url:      design?.etsy_url      || "",
    featured:      !!design?.featured,
    source:        design?.source        || "",
    created_at:    design?.created_at    || new Date().toISOString(),
  };
}

export function useDesigns(category?: string) {
  return useQuery({
    queryKey: ["designs", category],
    queryFn: async () => {
      if (!supabase || typeof supabase.from !== "function") {
        return [];
      }

      let query = supabase.from("designs").select("*");

      if (typeof query.order === "function") {
        query = query.order("created_at", { ascending: false });
      }

      if (category && category !== "All") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(enrichDesign);
    },
  });
}

export function useDesign(identifier: string) {
  return useQuery({
    queryKey: ["design", identifier],
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      if (isUUID) {
        const { data, error } = await supabase.from("designs").select("*").eq("id", identifier).maybeSingle();
        if (error) throw error;
        return data ? enrichDesign(data) : null;
      } else {
        // Try exact slug match first
        const { data: slugMatch } = await supabase
          .from("designs")
          .select("*")
          .eq("slug", identifier)
          .maybeSingle();

        if (slugMatch) return enrichDesign(slugMatch);

        // Fallback to fuzzy name match using ILIKE for efficiency
        const { data: fuzzyMatches } = await supabase
          .from("designs")
          .select("*")
          .ilike("name", `%${identifier.replace(/-/g, ' ')}%`)
          .limit(10);

        if (fuzzyMatches && fuzzyMatches.length > 0) {
          const match = fuzzyMatches.find(d => {
            const genSlug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            return genSlug === identifier;
          });
          if (match) return enrichDesign(match);
        }

        return null;
      }
    },
    enabled: !!identifier,
  });
}

export function useFeaturedDesigns() {
  return useQuery({
    queryKey: ["designs", "featured"],
    queryFn: async () => {
      if (!supabase || typeof supabase.from !== "function") {
        return [];
      }

      let query = supabase
        .from("designs")
        .select("*")
        .eq("featured", true);

      if (typeof query.order === "function") {
        query = query.order("created_at", { ascending: false });
      }

      if (typeof query.limit === "function") {
        query = query.limit(4);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(enrichDesign);
    },
  });
}
