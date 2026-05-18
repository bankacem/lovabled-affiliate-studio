import { Router } from "express";
import { db } from "@workspace/db";
import { userRolesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "aiprintverse-secret-key-change-in-production";

// Simple in-memory user store (production would use a proper users table)
// For now we rely on JWT + user_roles table
const usersStore = new Map<string, { id: string; email: string; passwordHash: string }>();

function getUserFromToken(authHeader?: string) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    // @ts-ignore
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

router.get("/auth/me", async (req, res) => {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    res.json({ id: "anonymous", email: null, isAdmin: false });
    return;
  }
  const roles = await db.select().from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, user.id), eq(userRolesTable.role, "admin")));
  res.json({ id: user.id, email: user.email, isAdmin: roles.length > 0 });
});

router.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;
  const user = [...usersStore.values()].find(u => u.email === email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // @ts-ignore
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  const roles = await db.select().from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, user.id), eq(userRolesTable.role, "admin")));
  res.json({ token, user: { id: user.id, email: user.email, isAdmin: roles.length > 0 } });
});

router.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if ([...usersStore.values()].find(u => u.email === email)) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  usersStore.set(id, { id, email, passwordHash });
  // @ts-ignore
  const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id, email, isAdmin: false } });
});

router.post("/auth/signout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/roles", async (req, res) => {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const isAdmin = await db.select().from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, user.id), eq(userRolesTable.role, "admin")));
  if (!isAdmin.length) { res.status(403).json({ error: "Forbidden" }); return; }
  const roles = await db.select().from(userRolesTable);
  res.json(roles);
});

router.post("/auth/roles", async (req, res) => {
  const { user_id, role } = req.body;
  const [inserted] = await db.insert(userRolesTable).values({ user_id, role }).returning();
  res.status(201).json(inserted);
});

export { getUserFromToken };
export default router;
