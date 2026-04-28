import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Design {
  id: string;
  slug: string;
  name: string;
  description: string;
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

/**
 * DATA AGNOSTIC: Ensures that even partial DB records or records with legacy
 * column names (like 'imageUrl') can be rendered without crashing the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrichDesign(design: any): Design {
  const safeName = design?.name || "Untitled Design";
  const safeSlug = design?.slug || design?.id || "no-slug";

  return {
    id:            design?.id            || `temp-${Math.random().toString(36).substring(2, 11)}`,
    slug:          safeSlug,
    name:          safeName,
    description:   design?.description   || "",
    image_url:     design?.image_url     || design?.imageUrl || design?.image || "/placeholder-design.svg",
    category:      design?.category      || "General",
    tags:          Array.isArray(design?.tags) ? design.tags : [],
    teepublic_url: design?.teepublic_url || design?.teepublicUrl || null,
    redbubble_url: design?.redbubble_url || design?.redbubbleUrl || null,
    amazon_url:    design?.amazon_url    || null,
    etsy_url:      design?.etsy_url      || null,
    featured:      !!design?.featured,
    source:        design?.source        || null,
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
        console.error("Error fetching designs:", error);
        return [];
      }

      return (data || []).map(enrichDesign);
    },
  });
}

export function useDesign(identifier: string) {
  return useQuery({
    queryKey: ["design", identifier],
    queryFn: async () => {
      if (!identifier || !supabase || typeof supabase.from !== "function") return null;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      try {
        if (isUUID) {
          const { data, error } = await supabase.from("designs").select("*").eq("id", identifier).maybeSingle();
          if (error) throw error;
          return data ? enrichDesign(data) : null;
        } else {
          // Try slug match first
          const { data: slugMatch, error: slugError } = await supabase
            .from("designs")
            .select("*")
            .eq("slug", identifier)
            .maybeSingle();

          if (slugMatch) return enrichDesign(slugMatch);

          // Fallback to searching all (for legacy or auto-generated slugs)
          const { data: allDesigns, error: allError } = await supabase.from("designs").select("*");
          if (allError) throw allError;

          const match = allDesigns?.find(d => {
            const genSlug = d.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
            return genSlug === identifier || d.id === identifier || d.slug === identifier;
          });

          return match ? enrichDesign(match) : null;
        }
      } catch (err) {
        console.error("Error fetching single design:", err);
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
        console.error("Error fetching featured designs:", error);
        return [];
      }

      return (data || []).map(enrichDesign);
    },
  });
}
