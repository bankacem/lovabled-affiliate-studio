import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Design as ApiDesign } from "@workspace/api-client-react";

export type Design = ApiDesign;

export function useDesigns(category?: string) {
  const selectedCategory = category && category !== "All" ? category : undefined;
  const result = useQuery({
    queryKey: ["designs", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("designs")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Design[];
    },
  });

  return {
    ...result,
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export function useDesign(id: string) {
  return useQuery({
    queryKey: ["design", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Design | null;
    },
  });
}

export function useFeaturedDesigns() {
  const result = useQuery({
    queryKey: ["featured-designs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("featured", true)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(4);

      if (error) throw error;
      return (data ?? []) as Design[];
    },
  });

  return {
    ...result,
    data: result.data,
  };
}
