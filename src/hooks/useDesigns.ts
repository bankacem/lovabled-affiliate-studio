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
        const { data, error } = await supabase.from("designs").select("*");
        if (error) throw error;
        const match = data?.find(d => {
          const genSlug = d.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
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

      return data as Design[];
    },
  });
}
