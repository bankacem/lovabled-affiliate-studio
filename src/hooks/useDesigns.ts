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

      return data as unknown as Design[];
    },
  });
}

export function useDesign(identifier: string) {
  return useQuery({
    queryKey: ["design", identifier],
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

      let query = supabase.from("designs").select("*");

      if (isUUID) {
        query = query.eq("id", identifier);
      } else {
        query = query.eq("id", identifier);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      return data as unknown as Design | null;
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

      return data as unknown as Design[];
    },
  });
}
