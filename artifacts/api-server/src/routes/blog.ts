import { Router } from "express";
import { db, blogPostsTable, blogCategoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, or, sql, count } from "drizzle-orm";

const router = Router();

router.get("/blog/stats", async (_req, res) => {
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

  const conditions = [];
  // Public: only published unless status param passed (admin)
  if (status) {
    conditions.push(eq(blogPostsTable.status, status));
  } else {
    conditions.push(eq(blogPostsTable.status, "published"));
  }
  if (category && category !== "All") conditions.push(eq(blogPostsTable.category, category));
  if (source) conditions.push(eq(blogPostsTable.source, source));
  if (search) conditions.push(ilike(blogPostsTable.title, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(blogPostsTable).where(where);
  const posts = await db.select().from(blogPostsTable)
    .where(where)
    .orderBy(desc(blogPostsTable.published_at))
    .limit(ps)
    .offset(from);

  res.json({ posts, total: Number(total), page: pg, pageSize: ps, totalPages: Math.ceil(Number(total) / ps) });
});

router.post("/blog/posts", async (req, res) => {
  const data = { ...req.body };
  if (data.published_at) data.published_at = new Date(data.published_at);
  if (data.scheduled_publish_at) data.scheduled_publish_at = new Date(data.scheduled_publish_at);
  const [post] = await db.insert(blogPostsTable).values(data).returning();
  res.status(201).json(post);
});

router.get("/blog/posts/slug/:slug", async (req, res) => {
  const [post] = await db.select().from(blogPostsTable)
    .where(and(eq(blogPostsTable.slug, req.params.slug), eq(blogPostsTable.status, "published")));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

router.get("/blog/posts/:id", async (req, res) => {
  const [post] = await db.select().from(blogPostsTable).where(eq(blogPostsTable.id, req.params.id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

router.patch("/blog/posts/:id", async (req, res) => {
  const data = { ...req.body, updated_at: new Date() };
  if (data.published_at) data.published_at = new Date(data.published_at);
  if (data.scheduled_publish_at) data.scheduled_publish_at = new Date(data.scheduled_publish_at);
  const [post] = await db.update(blogPostsTable).set(data).where(eq(blogPostsTable.id, req.params.id)).returning();
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(post);
});

router.delete("/blog/posts/:id", async (req, res) => {
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, req.params.id));
  res.status(204).end();
});

router.get("/blog/categories", async (_req, res) => {
  const cats = await db.select().from(blogCategoriesTable).orderBy(blogCategoriesTable.name);
  res.json(cats);
});

router.post("/blog/categories", async (req, res) => {
  const [cat] = await db.insert(blogCategoriesTable).values(req.body).returning();
  res.status(201).json(cat);
});

export default router;
