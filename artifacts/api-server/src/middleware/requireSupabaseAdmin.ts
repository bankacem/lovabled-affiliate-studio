import type { NextFunction, Request, Response } from "express";

interface SupabaseUser {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function supabaseAuthConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function bearerToken(req: Request): string | null {
  const value = req.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7).trim() || null : null;
}

function metadataAdmin(user: SupabaseUser): boolean {
  const appMetadata = user.app_metadata;
  const userMetadata = user.user_metadata;
  const roles = appMetadata?.roles;
  return (
    appMetadata?.role === "admin" ||
    userMetadata?.role === "admin" ||
    userMetadata?.isAdmin === true ||
    (Array.isArray(roles) && roles.includes("admin"))
  );
}

async function resolveUser(req: Request): Promise<SupabaseUser | null> {
  const token = bearerToken(req);
  if (!token || !supabaseAuthConfigured()) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

async function hasAdminRole(user: SupabaseUser): Promise<boolean> {
  if (supabaseServiceRoleKey) {
    const params = new URLSearchParams({ select: "role", user_id: `eq.${user.id}`, role: "eq.admin", limit: "1" });
    const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?${params.toString()}`, {
      headers: { apikey: supabaseServiceRoleKey, Authorization: `Bearer ${supabaseServiceRoleKey}` },
    });
    if (!response.ok) return false;
    const rows = await response.json() as Array<{ role?: string }>;
    return rows.some((row) => row.role === "admin");
  }
  return metadataAdmin(user);
}

export async function requireSupabaseAdmin(req: Request, res: Response, next: NextFunction) {
  if (!supabaseAuthConfigured()) {
    res.status(503).json({ error: "Supabase auth is not configured on the API server" });
    return;
  }
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: "Supabase session is required" });
    return;
  }
  if (!(await hasAdminRole(user))) {
    res.status(403).json({ error: "Admin role is required" });
    return;
  }
  (req as Request & { supabaseUser?: SupabaseUser }).supabaseUser = user;
  return next();
}
