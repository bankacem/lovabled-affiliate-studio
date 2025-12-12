import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Design {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  tags: string[];
  teepublic_url: string | null;
  redbubble_url: string | null;
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

export function useDesign(id: string) {
  return useQuery({
    queryKey: ["design", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Design | null;
    },
    enabled: !!id,
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
