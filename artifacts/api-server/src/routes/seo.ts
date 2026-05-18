import { Router } from "express";
import { db, autoLinkKeywordsTable, articleTemplatesTable, generationBatchesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Auto-link keywords
router.get("/seo/auto-link-keywords", async (_req, res) => {
  const kw = await db.select().from(autoLinkKeywordsTable).where(eq(autoLinkKeywordsTable.is_active, true)).orderBy(desc(autoLinkKeywordsTable.priority));
  res.json(kw);
});

router.post("/seo/auto-link-keywords", async (req, res) => {
  const data = { ...req.body };
  if (data.target_post_id === "") delete data.target_post_id;
  const [kw] = await db.insert(autoLinkKeywordsTable).values(data)
    .onConflictDoUpdate({ target: [autoLinkKeywordsTable.keyword, autoLinkKeywordsTable.target_post_id], set: { priority: data.priority, is_active: data.is_active ?? true } })
    .returning();
  res.status(201).json(kw);
});

router.delete("/seo/auto-link-keywords/:id", async (req, res) => {
  await db.delete(autoLinkKeywordsTable).where(eq(autoLinkKeywordsTable.id, req.params.id));
  res.status(204).end();
});

// Article templates
router.get("/seo/article-templates", async (_req, res) => {
  const templates = await db.select().from(articleTemplatesTable).orderBy(desc(articleTemplatesTable.created_at));
  res.json(templates);
});

router.post("/seo/article-templates", async (req, res) => {
  const [t] = await db.insert(articleTemplatesTable).values(req.body).returning();
  res.status(201).json(t);
});

// Generation batches
router.get("/seo/generation-batches", async (_req, res) => {
  const batches = await db.select().from(generationBatchesTable).orderBy(desc(generationBatchesTable.created_at));
  res.json(batches);
});

router.post("/seo/generation-batches", async (req, res) => {
  const [batch] = await db.insert(generationBatchesTable).values(req.body).returning();
  res.status(201).json(batch);
});

export default router;
