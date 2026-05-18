import { useListDesigns, useGetDesign } from "@workspace/api-client-react";

export type { Design } from "@workspace/api-client-react";

export function useDesigns(category?: string) {
  const result = useListDesigns({ category: category !== "All" ? category : undefined, limit: 100 });
  return {
    ...result,
    data: result.data?.designs,
    isLoading: result.isLoading,
    error: result.error,
  };
}

export function useDesign(id: string) {
  return useGetDesign(id, { query: { enabled: !!id } });
}

export function useFeaturedDesigns() {
  const result = useListDesigns({ featured: true, limit: 4 });
  return {
    ...result,
    data: result.data?.designs,
  };
}
