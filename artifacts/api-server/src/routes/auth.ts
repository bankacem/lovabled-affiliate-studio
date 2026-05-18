import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, userRolesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserFromToken, requireAdmin } from "../middleware/requireAuth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "aiprintverse-secret-key-change-in-production";

async function makeToken(id: string, email: string) {
  // @ts-ignore
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
}

async function isAdmin(userId: string) {
  const roles = await db.select().from(userRolesTable)
    .where(and(eq(userRolesTable.user_id, userId), eq(userRolesTable.role, "admin")));
  return roles.length > 0;
}

router.get("/auth/me", async (req, res) => {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) {
    res.json({ id: "anonymous", email: null, isAdmin: false });
    return;
  }
  res.json({ id: user.id, email: user.email, isAdmin: await isAdmin(user.id) });
});

router.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = await makeToken(user.id, user.email);
  res.json({ token, user: { id: user.id, email: user.email, isAdmin: await isAdmin(user.id) } });
});

router.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const normalizedEmail = email.toLowerCase().trim();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const password_hash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ email: normalizedEmail, password_hash }).returning();
  const token = await makeToken(user.id, user.email);
  res.status(201).json({ token, user: { id: user.id, email: user.email, isAdmin: false } });
});

router.post("/auth/signout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/roles", async (req, res) => {
  const user = getUserFromToken(req.headers.authorization);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!(await isAdmin(user.id))) { res.status(403).json({ error: "Forbidden" }); return; }
  const roles = await db.select().from(userRolesTable);
  res.json(roles);
});

router.post("/auth/roles", requireAdmin, async (req, res) => {
  const { user_id, role } = req.body ?? {};
  if (!user_id || !role) { res.status(400).json({ error: "user_id and role are required" }); return; }
  const [inserted] = await db.insert(userRolesTable).values({ user_id, role })
    .onConflictDoNothing().returning();
  res.status(201).json(inserted ?? { user_id, role });
});

export { getUserFromToken };
export default router;
