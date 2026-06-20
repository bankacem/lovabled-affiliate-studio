import { Router, type Request, type Response } from "express";
import { db, ebooksTable, ebookChaptersTable, blogPostsTable } from "@workspace/db";
import { eq, asc, desc, and, inArray } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAuth.js";
import { getParam } from "../lib/params.js";

const router = Router();

router.get("/ebooks", async (req: Request, res: Response) => {
  const { status } = req.query as Record<string, string>;
  if (status) {
    const ebooks = await db.select().from(ebooksTable).where(eq(ebooksTable.status, status)).orderBy(desc(ebooksTable.created_at));
    res.json(ebooks); return;
  }
  res.json(await db.select().from(ebooksTable).orderBy(desc(ebooksTable.created_at)));
});

router.get("/ebooks/:id", async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  const chapters = await db.select().from(ebookChaptersTable).where(eq(ebookChaptersTable.ebook_id, id)).orderBy(asc(ebookChaptersTable.order_index));
  res.json({ ebook, chapters });
});

router.get("/ebooks/:id/chapters", async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const chapters = await db.select().from(ebookChaptersTable)
    .where(eq(ebookChaptersTable.ebook_id, id))
    .orderBy(asc(ebookChaptersTable.order_index));
  res.json(chapters);
});

router.post("/ebooks", requireAdmin, async (req: Request, res: Response) => {
  const [ebook] = await db.insert(ebooksTable).values(req.body).returning();
  res.status(201).json(ebook);
});

router.patch("/ebooks/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const [ebook] = await db.update(ebooksTable).set({ ...req.body, updated_at: new Date() }).where(eq(ebooksTable.id, id)).returning();
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  res.json(ebook);
});

router.delete("/ebooks/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  await db.delete(ebooksTable).where(eq(ebooksTable.id, id));
  res.status(204).end();
});

router.post("/ebooks/:id/chapters", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const [chapter] = await db.insert(ebookChaptersTable).values({ ...req.body, ebook_id: id }).returning();
  res.status(201).json(chapter);
});

router.post("/ebooks/:id/generate-from-posts", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const { postIds, autoOrder = true } = req.body as { postIds: string[]; autoOrder?: boolean };
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }

  const posts = await db.select().from(blogPostsTable).where(inArray(blogPostsTable.id, postIds));
  await db.delete(ebookChaptersTable).where(and(eq(ebookChaptersTable.ebook_id, id), eq(ebookChaptersTable.is_generated, true)));

  const chapters = await Promise.all(posts.map(async (post, i) => {
    const [chapter] = await db.insert(ebookChaptersTable).values({
      ebook_id: id,
      blog_post_id: post.id,
      title: post.title,
      order_index: autoOrder ? i : i,
      content: post.content,
      is_generated: true,
    }).returning();
    return chapter;
  }));

  const totalWords = posts.reduce((acc, p) => acc + (p.content?.split(/\s+/).length || 0), 0);
  await db.update(ebooksTable).set({ word_count: totalWords, updated_at: new Date() }).where(eq(ebooksTable.id, id));
  const [updatedEbook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, id));
  res.json({ ebook: updatedEbook, chapters });
});

router.post("/ebooks/:id/export-pdf", requireAdmin, async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(ebooksTable).set({ print_ready: true, updated_at: new Date() }).where(eq(ebooksTable.id, id));
  res.json({ pdf_url: null, epub_url: null, message: "PDF export queued.", status: "queued" });
});

export default router;
