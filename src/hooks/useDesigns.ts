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

export function useDesigns(category?: string) {
  return useQuery({
    queryKey: ["designs", category],
    queryFn: async () => {
      let query = supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false });

      if (category && category !== "All") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Design[];
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
        return data as Design | null;
      } else {
        // First try exact slug match in DB
        const { data: slugExact, error: slugError } = await supabase
          .from("designs")
          .select("*")
          .eq("slug", identifier)
          .maybeSingle();

        if (slugError) throw slugError;
        if (slugExact) return slugExact as Design;

        // Try fuzzy search on slug
        const { data: slugFuzzy } = await supabase
          .from("designs")
          .select("*")
          .ilike("slug", `%${identifier}%`)
          .limit(1);

        if (slugFuzzy?.[0]) return slugFuzzy[0] as Design;

        // Fallback to searching all designs by generated slug (for legacy/missing slugs)
        const { data: allDesigns, error: allDocsError } = await supabase.from("designs").select("*");
        if (allDocsError) throw allDocsError;

        const match = allDesigns?.find(d => {
          const genSlug = d.slug || d.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          return genSlug === identifier || d.id === identifier;
        });

        return (match as Design | null) || null;
      }
    },
    enabled: !!identifier,
  });
}

export function useFeaturedDesigns() {
  return useQuery({
    queryKey: ["designs", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        throw error;
      }

      return data as Design[];
    },
  });
}
