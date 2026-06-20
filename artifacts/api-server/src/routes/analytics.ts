import { Router, type Request, type Response } from "express";
import { db, pageViewsTable, linkTrackingTable, blogPostsTable } from "@workspace/db";
import { eq, desc, sql, and, isNull, gte } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth.js";

const router = Router();

// Public: record a page view
router.post("/analytics/pageview", async (req: Request, res: Response) => {
  const { page_path, page_title, referrer, user_agent, session_id, post_id } = req.body;
  await db.insert(pageViewsTable).values({ page_path, page_title, referrer, user_agent, session_id, post_id: post_id || null });
  if (post_id) {
    await db.execute(sql`UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ${post_id}`);
  }
  res.status(201).json({ success: true });
});

// Public: record a link click (increments click_count)
router.post("/analytics/link-click", async (req: Request, res: Response) => {
  const { target_url, link_text, source_post_id, link_type } = req.body;
  const conditions = [eq(linkTrackingTable.target_url, target_url)];
  if (source_post_id) {
    conditions.push(eq(linkTrackingTable.source_post_id, source_post_id));
  } else {
    conditions.push(isNull(linkTrackingTable.source_post_id));
  }
  const [existing] = await db.select().from(linkTrackingTable).where(and(...conditions));
  if (existing) {
    await db.update(linkTrackingTable).set({ click_count: existing.click_count + 1, updated_at: new Date() }).where(eq(linkTrackingTable.id, existing.id));
  } else {
    await db.insert(linkTrackingTable).values({ target_url, link_text, source_post_id: source_post_id || null, link_type: link_type || "external", click_count: 1 });
  }
  res.json({ success: true });
});

// Admin: list/search raw page_views rows (for AnalyticsDashboard)
router.get("/analytics/page-views", requireAdmin, async (req: Request, res: Response) => {
  const { since } = req.query as Record<string, string>;
  if (since) {
    const rows = await db.select().from(pageViewsTable).where(gte(pageViewsTable.created_at, new Date(since)));
    res.json(rows);
  } else {
    const rows = await db.select().from(pageViewsTable).orderBy(desc(pageViewsTable.created_at)).limit(10000);
    res.json(rows);
  }
});

// Admin: aggregated stats
router.get("/analytics/stats", requireAdmin, async (_req: Request, res: Response) => {
  const [totals] = await db.select({
    totalPageViews: sql<number>`count(*)`,
    uniqueSessions: sql<number>`count(distinct session_id)`,
  }).from(pageViewsTable);
  const topPages = await db.select({ path: pageViewsTable.page_path, views: sql<number>`count(*)` })
    .from(pageViewsTable).groupBy(pageViewsTable.page_path).orderBy(desc(sql`count(*)`)).limit(10);
  const [recent] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable)
    .where(sql`created_at > now() - interval '24 hours'`);
  res.json({
    totalPageViews: Number(totals?.totalPageViews || 0),
    uniqueSessions: Number(totals?.uniqueSessions || 0),
    topPages: topPages.map(p => ({ path: p.path, views: Number(p.views) })),
    recentViews: Number(recent?.count || 0),
  });
});

// Admin: list all link tracking rows ordered by click_count
router.get("/analytics/link-tracking", requireAdmin, async (_req: Request, res: Response) => {
  const links = await db.select().from(linkTrackingTable).orderBy(desc(linkTrackingTable.click_count)).limit(100);
  res.json(links);
});

// Admin: upsert a link tracking row (for "Scan All Articles" indexing — preserves click_count)
router.post("/analytics/link-tracking", requireAdmin, async (req: Request, res: Response) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];
  for (const item of items) {
    const { target_url, link_text, link_type, source_post_id, click_count = 0 } = item as Record<string, unknown>;
    const conditions = [eq(linkTrackingTable.target_url, target_url as string)];
    if (source_post_id) {
      conditions.push(eq(linkTrackingTable.source_post_id, source_post_id as string));
    } else {
      conditions.push(isNull(linkTrackingTable.source_post_id));
    }
    const [existing] = await db.select().from(linkTrackingTable).where(and(...conditions));
    if (existing) {
      // Preserve existing click_count (indexing, not clicking)
      results.push(existing);
    } else {
      const [inserted] = await db.insert(linkTrackingTable).values({
        target_url: target_url as string,
        link_text: link_text as string,
        link_type: (link_type as string) || "external",
        source_post_id: (source_post_id as string) || null,
        click_count: Number(click_count),
      }).returning();
      results.push(inserted);
    }
  }
  res.status(201).json(results.length === 1 ? results[0] : results);
});

// Admin: get single link tracking row by id + source_post_id (for existence check in ArticleOptimizer)
router.get("/analytics/link-tracking/check", requireAdmin, async (req: Request, res: Response) => {
  const { target_url, source_post_id } = req.query as Record<string, string>;
  if (!target_url) { res.status(400).json({ error: "target_url required" }); return; }
  const conditions = [eq(linkTrackingTable.target_url, target_url)];
  if (source_post_id) {
    conditions.push(eq(linkTrackingTable.source_post_id, source_post_id));
  } else {
    conditions.push(isNull(linkTrackingTable.source_post_id));
  }
  const [row] = await db.select().from(linkTrackingTable).where(and(...conditions));
  res.json(row || null);
});

export default router;
