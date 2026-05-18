import { Router } from "express";
import { db, blogPostsTable, designsTable, ebooksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/sitemap", async (_req, res) => {
  const posts = await db.select({ slug: blogPostsTable.slug, updated_at: blogPostsTable.updated_at }).from(blogPostsTable).where(eq(blogPostsTable.status, "published"));
  const designs = await db.select({ id: designsTable.id, updated_at: designsTable.updated_at }).from(designsTable);
  const ebooks = await db.select({ slug: ebooksTable.slug, updated_at: ebooksTable.updated_at }).from(ebooksTable).where(eq(ebooksTable.status, "published"));
  res.json({
    posts: posts.map(p => ({ slug: p.slug, updated_at: p.updated_at?.toISOString() || new Date().toISOString(), priority: 0.8 })),
    designs: designs.map(d => ({ id: d.id, updated_at: d.updated_at?.toISOString() || new Date().toISOString() })),
    ebooks: ebooks.map(e => ({ slug: e.slug, updated_at: e.updated_at?.toISOString() || new Date().toISOString() })),
  });
});

export default router;
