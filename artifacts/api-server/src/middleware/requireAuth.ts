import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { userRolesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "aiprintverse-secret-key-change-in-production";

export function getUserFromToken(authHeader?: string): { id: string; email: string } | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    // @ts-ignore
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
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
  (req as any).user = user;
  next();
}
