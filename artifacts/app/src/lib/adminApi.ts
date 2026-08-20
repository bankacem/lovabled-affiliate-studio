import { supabase } from "@/integrations/supabase/client";

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `API request failed (${response.status})`);
  return payload as T;
}

export interface BlogIndexSummary {
  posts: Array<{
    slug: string;
    title: string;
    status: string;
    updated_at?: string | null;
    published_at?: string | null;
    created_at?: string | null;
  }>;
}

export async function loadBlogIndex(): Promise<BlogIndexSummary> {
  const response = await fetch("/blog-index.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load article index (${response.status})`);
  return response.json();
}

export async function listDesigns<T = unknown>(): Promise<T[]> {
  const payload = await adminFetch<{ designs: T[] }>("/designs?limit=500&offset=0");
  return payload.designs ?? [];
}

export async function updateDesign<T = unknown>(id: string, patch: Record<string, unknown>): Promise<T> {
  return adminFetch<T>(`/designs/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteDesign(id: string): Promise<void> {
  await adminFetch<null>(`/designs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listStores<T = unknown>(): Promise<T[]> {
  return adminFetch<T[]>("/stores");
}
