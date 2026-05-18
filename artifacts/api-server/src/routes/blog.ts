import { Router } from "express";
import { db, blogPostsTable, blogCategoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, inArray } from "drizzle-orm";
import { requireAdmin, getUserFromToken } from "../middleware/requireAuth";
import { userRolesTable } from "@workspace/db";

const router = Router();

router.get("/blog/stats", requireAdmin, async (_req, res) => {
  const [totals] = await db.select({
    total: sql<number>`count(*)`,
    published: sql<number>`sum(case when status='published' then 1 else 0 end)`,
    draft: sql<number>`sum(case when status='draft' then 1 else 0 end)`,
    scheduled: sql<number>`sum(case when status='scheduled' then 1 else 0 end)`,
  }).from(blogPostsTable);
  const cats = await db.select({ category: blogPostsTable.category, ct: sql<number>`count(*)` }).from(blogPostsTable).groupBy(blogPostsTable.category);
  const byCategory: Record<string, number> = {};
  cats.forEach(c => { byCategory[c.category] = Number(c.ct); });
  const recentPosts = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.created_at)).limit(5);
  res.json({
    total: Number(totals?.total || 0),
    published: Number(totals?.published || 0),
    draft: Number(totals?.draft || 0),
    scheduled: Number(totals?.scheduled || 0),
    byCategory,
    recentPosts,
  });
});

router.get("/blog/posts", async (req, res) => {
  const { page = "1", pageSize = "12", category, status, source, search } = req.query as Record<string, string>;
  const pg = Math.max(1, Number(page));
  const ps = Math.min(100, Math.max(1, Number(pageSize)));
  const from = (pg - 1) * ps;

  const requestedStatus = status || "published";
  const isPublicRequest = requestedStatus === "published";
  if (!isPublicRequest) {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ error: "Authentication required to view non-published posts" });
      return;
    }
    const roles = await db.select().from(userRolesTable)
      .where(and(eq(userRolesTable.user_id, user.id), eq(userRolesTable.role, "admin")));
    if (!roles.length) {
      res.status(403).json({ error: "Admin access required to view non-published posts" });
      return;
    }
  }

  const conditions = [eq(blogPostsTable.status, requestedStatus)];
  if (category && category !== "All") conditions.push(eq(blogPostsTable.category, category));
  if (source) conditions.push(eq(blogPostsTable.source, source));
  if (search) conditions.push(ilike(blogPostsTable.title, `%${search}%`));

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(blogPostsTable).where(where);
  const posts = await db.select().from(blogPostsTable)
    .where(where)
    .orderBy(desc(blogPostsTable.published_at))
    .limit(ps)
    .offset(from);

  res.json({ posts, total: Number(total), page: pg, pageSize: ps, totalPages: Math.ceil(Number(total) / ps) });
});

// Check which slugs already exist (for duplicate detection before batch insert)
router.get("/blog/posts/slugs-exist", requireAdmin, async (req, res) => {
  const slugParam = req.query.slugs as string | undefined;
  if (!slugParam) { res.json([]); return; }
  const slugs = slugParam.split(",").filter(Boolean);
  if (!slugs.length) { res.json([]); return; }
  const rows = await db.select({ slug: blogPostsTable.slug }).from(blogPostsTable)
    .where(inArray(blogPostsTable.slug, slugs));
  res.json(rows);
});

// Get all posts for a generation batch (with optional status filter)
router.get("/blog/posts/by-batch/:batchId", requireAdmin, async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const conditions: ReturnType<typeof eq>[] = [eq(blogPostsTable.generation_batch, req.params.batchId)];
  if (status) conditions.push(eq(blogPostsTable.status, status));
  const posts = await db.select().from(blogPostsTable)
    .where(and(...conditions))
    .orderBy(desc(blogPostsTable.created_at))
    .limit(500);
  res.json(posts);
});

// Batch publish/update all posts in a generation batch (with optional current-status filter)
router.patch("/blog/posts/by-batch/:batchId", requireAdmin, async (req, res) => {
  const { filter_status, ...updateData } = req.body as Record<string, unknown>;
  const update = { ...updateData, updated_at: new Date() };
  if (update.published_at) update.published_at = new Date(update.published_at as string);
  if (update.scheduled_publish_at) update.scheduled_publish_at = new Date(update.scheduled_publish_at as string);

  const conditions: ReturnType<typeof eq>[] = [eq(blogPostsTable.generation_batch, req.params.batchId)];
  if (filter_status) conditions.push(eq(blogPostsTable.status, filter_status as string));

  const posts = await db.update(blogPostsTable).set(update)
    .where(and(...conditions))
    .returning();
  res.json(posts);
});

// Delete all posts in a generation batch
router.delete("/blog/posts/by-batch/:batchId", requireAdmin, async (req, res) => {
  await db.delete(blogPostsTable).where(eq(blogPostsTable.generation_batch, req.params.batchId));
  res.status(204).end();
});

router.get("/blog/posts/slug/:slug", async (req, res) => {
  const [post] = await db.select().from(blogPostsTable)
    .where(and(eq(blogPostsTable.slug, req.params.slug), eq(blogPostsTable.status, "published")));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

router.get("/blog/posts/:id", requireAdmin, async (req, res) => {
  const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, req.params.id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

router.post("/blog/posts", requireAdmin, async (req, res) => {
  const data = { ...req.body };
  if (data.published_at) data.published_at = new Date(data.published_at);
  if (data.scheduled_publish_at) data.scheduled_publish_at = new Date(data.scheduled_publish_at);
  const [post] = await db.insert(blogPostsTable).values(data).returning();
  res.status(201).json(post);
});

router.patch("/blog/posts/:id", requireAdmin, async (req, res) => {
  const data = { ...req.body, updated_at: new Date() };
  if (data.published_at) data.published_at = new Date(data.published_at);
  if (data.scheduled_publish_at) data.scheduled_publish_at = new Date(data.scheduled_publish_at);
  const [post] = await db.update(blogPostsTable).set(data).where(eq(blogPostsTable.id, req.params.id)).returning();
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

// Batch update by explicit id array (used by SchedulingPanel)
router.patch("/blog/posts", requireAdmin, async (req, res) => {
  const { ids, data: updateData } = req.body as { ids: string[]; data: Record<string, unknown> };
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: "ids array required" });
    return;
  }
  const update = { ...updateData, updated_at: new Date() };
  if (update.published_at) update.published_at = new Date(update.published_at as string);
  const posts = await db.update(blogPostsTable).set(update).where(inArray(blogPostsTable.id, ids)).returning();
  res.json(posts);
});

router.delete("/blog/posts/:id", requireAdmin, async (req, res) => {
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, req.params.id));
  res.status(204).end();
});

router.get("/blog/categories", async (_req, res) => {
  const cats = await db.select().from(blogCategoriesTable).orderBy(blogCategoriesTable.name);
  res.json(cats);
});

router.post("/blog/categories", requireAdmin, async (req, res) => {
  const [cat] = await db.insert(blogCategoriesTable).values(req.body).returning();
  res.status(201).json(cat);
});

export default router;
