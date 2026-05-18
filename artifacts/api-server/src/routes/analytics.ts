import { Router } from "express";
import { db, pageViewsTable, linkTrackingTable, blogPostsTable } from "@workspace/db";
import { eq, desc, sql, and, isNull } from "drizzle-orm";

const router = Router();

router.post("/analytics/pageview", async (req, res) => {
  const { page_path, page_title, referrer, user_agent, session_id, post_id } = req.body;
  await db.insert(pageViewsTable).values({ page_path, page_title, referrer, user_agent, session_id, post_id: post_id || null });
  if (post_id) {
    await db.execute(sql`UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ${post_id}`);
  }
  res.status(201).json({ success: true });
});

router.post("/analytics/link-click", async (req, res) => {
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

router.get("/analytics/stats", async (_req, res) => {
  const [totals] = await db.select({ totalPageViews: sql<number>`count(*)`, uniqueSessions: sql<number>`count(distinct session_id)` }).from(pageViewsTable);
  const topPages = await db.select({ path: pageViewsTable.page_path, views: sql<number>`count(*)` })
    .from(pageViewsTable).groupBy(pageViewsTable.page_path).orderBy(desc(sql`count(*)`)).limit(10);
  const [recent] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable)
    .where(sql`created_at > now() - interval '24 hours'`);
  res.json({ totalPageViews: Number(totals?.totalPageViews || 0), uniqueSessions: Number(totals?.uniqueSessions || 0), topPages: topPages.map(p => ({ path: p.path, views: Number(p.views) })), recentViews: Number(recent?.count || 0) });
});

router.get("/analytics/link-tracking", async (_req, res) => {
  const links = await db.select().from(linkTrackingTable).orderBy(desc(linkTrackingTable.click_count)).limit(100);
  res.json(links);
});

export default router;
