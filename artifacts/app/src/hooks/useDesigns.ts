import { useQuery } from "@tanstack/react-query";
import type { Design as ApiDesign } from "@workspace/api-client-react";

export type Design = ApiDesign;

async function apiJson<T>(path: string, notFoundFallback?: T): Promise<T> {
  const response = await fetch(`/api${path}`, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => null);
  if (response.status === 404 && notFoundFallback !== undefined) {
    return notFoundFallback;
  }
  if (!response.ok) {
    throw new Error(payload?.error || `Failed to load designs (${response.status})`);
  }
  return payload as T;
}

export function useDesigns(category?: string) {
  const selectedCategory = category && category !== "All" ? category : undefined;
  const result = useQuery({
    queryKey: ["designs", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "500", offset: "0" });
      if (selectedCategory) params.set("category", selectedCategory);
      const payload = await apiJson<{ designs: Design[]; total: number }>(
        `/designs?${params.toString()}`,
        { designs: [], total: 0 },
      );
      return payload.designs ?? [];
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
    queryFn: () => apiJson<Design | null>(`/designs/${encodeURIComponent(id)}`, null),
  });
}

export function useFeaturedDesigns() {
  const result = useQuery({
    queryKey: ["featured-designs"],
    queryFn: async () => {
      const payload = await apiJson<{ designs: Design[] }>(
        "/designs?featured=true&limit=4&offset=0",
        { designs: [] },
      );
      return payload.designs ?? [];
    },
  });

  return {
    ...result,
    data: result.data,
  };
}
