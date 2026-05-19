import { Router } from "express";
import { db, designsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth";
import { getParam } from "../lib/params";

const router = Router();

router.get("/designs/categories", async (_req, res) => {
  const results = await db.selectDistinct({ category: designsTable.category }).from(designsTable);
  res.json(results.map(r => r.category));
});

router.get("/designs/stats", async (_req, res) => {
  const [totals] = await db.select({
    total: sql<number>`count(*)`,
    featured: sql<number>`sum(case when featured then 1 else 0 end)`,
  }).from(designsTable);
  const categories = await db.select({ category: designsTable.category, count: sql<number>`count(*)` }).from(designsTable).groupBy(designsTable.category);
  const byCategory: Record<string, number> = {};
  categories.forEach(c => { byCategory[c.category] = Number(c.count); });
  res.json({ total: Number(totals?.total || 0), featured: Number(totals?.featured || 0), byCategory });
});

router.get("/designs", async (req, res) => {
  const { category, featured, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const conditions = [];
  if (category && category !== "All") conditions.push(eq(designsTable.category, category));
  if (featured === "true") conditions.push(eq(designsTable.featured, true));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(designsTable).where(where);
  const designs = await db.select().from(designsTable)
    .where(where)
    .orderBy(desc(designsTable.created_at))
    .limit(Number(limit))
    .offset(Number(offset));
  res.json({ designs, total: Number(count) });
});

router.get("/designs/:id", async (req, res) => {
  const id = getParam(req, "id");
  const [design] = await db.select().from(designsTable).where(eq(designsTable.id, id));
  if (!design) { res.status(404).json({ error: "Not found" }); return; }
  res.json(design);
});

router.post("/designs", requireAdmin, async (req, res) => {
  const [design] = await db.insert(designsTable).values(req.body).returning();
  res.status(201).json(design);
});

router.patch("/designs/:id", requireAdmin, async (req, res) => {
  const id = getParam(req, "id");
  const [design] = await db.update(designsTable).set({ ...req.body, updated_at: new Date() }).where(eq(designsTable.id, id)).returning();
  if (!design) { res.status(404).json({ error: "Not found" }); return; }
  res.json(design);
});

router.delete("/designs/:id", requireAdmin, async (req, res) => {
  const id = getParam(req, "id");
  await db.delete(designsTable).where(eq(designsTable.id, id));
  res.status(204).end();
});

export default router;
