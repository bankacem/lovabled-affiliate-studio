import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db, userRolesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireSupabaseAdmin, supabaseAuthConfigured } from "./requireSupabaseAdmin.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production" && !supabaseAuthConfigured()) {
  throw new Error("JWT_SECRET or Supabase Auth must be configured in production");
}
const DEV_JWT_SECRET = "aiprintverse-dev-secret-do-not-use-in-production";
const signingSecret = JWT_SECRET || DEV_JWT_SECRET;

export function getUserFromToken(authHeader?: string): { id: string; email: string } | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    return jwt.verify(token, signingSecret) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (supabaseAuthConfigured()) return requireSupabaseAdmin(req, res, next);
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { user?: typeof user }).user = user;
  return next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (supabaseAuthConfigured()) return requireSupabaseAdmin(req, res, next);
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const roles = await db.select().from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, user.id), eq(userRolesTable.role, "admin")));
  if (!roles.length) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  (req as Request & { user?: typeof user }).user = user;
  return next();
}
