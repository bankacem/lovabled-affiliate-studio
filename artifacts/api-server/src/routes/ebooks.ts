import { Router } from "express";
import { db, ebooksTable, ebookChaptersTable, blogPostsTable } from "@workspace/db";
import { eq, asc, desc, and, inArray } from "drizzle-orm";

const router = Router();

router.get("/ebooks", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const query = db.select().from(ebooksTable).orderBy(desc(ebooksTable.created_at));
  if (status) {
    const ebooks = await db.select().from(ebooksTable).where(eq(ebooksTable.status, status)).orderBy(desc(ebooksTable.created_at));
    res.json(ebooks); return;
  }
  res.json(await query);
});

router.post("/ebooks", async (req, res) => {
  const [ebook] = await db.insert(ebooksTable).values(req.body).returning();
  res.status(201).json(ebook);
});

router.get("/ebooks/:id", async (req, res) => {
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, req.params.id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  const chapters = await db.select().from(ebookChaptersTable).where(eq(ebookChaptersTable.ebook_id, req.params.id)).orderBy(asc(ebookChaptersTable.order_index));
  res.json({ ebook, chapters });
});

router.patch("/ebooks/:id", async (req, res) => {
  const [ebook] = await db.update(ebooksTable).set({ ...req.body, updated_at: new Date() }).where(eq(ebooksTable.id, req.params.id)).returning();
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  res.json(ebook);
});

router.delete("/ebooks/:id", async (req, res) => {
  await db.delete(ebooksTable).where(eq(ebooksTable.id, req.params.id));
  res.status(204).end();
});

router.get("/ebooks/:id/chapters", async (req, res) => {
  const chapters = await db.select().from(ebookChaptersTable)
    .where(eq(ebookChaptersTable.ebook_id, req.params.id))
    .orderBy(asc(ebookChaptersTable.order_index));
  res.json(chapters);
});

router.post("/ebooks/:id/chapters", async (req, res) => {
  const [chapter] = await db.insert(ebookChaptersTable).values({ ...req.body, ebook_id: req.params.id }).returning();
  res.status(201).json(chapter);
});

router.post("/ebooks/:id/generate-from-posts", async (req, res) => {
  const { postIds, autoOrder = true } = req.body as { postIds: string[]; autoOrder?: boolean };
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, req.params.id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }

  const posts = await db.select().from(blogPostsTable).where(inArray(blogPostsTable.id, postIds));

  // Delete existing generated chapters
  await db.delete(ebookChaptersTable).where(and(eq(ebookChaptersTable.ebook_id, req.params.id), eq(ebookChaptersTable.is_generated, true)));

  // Create chapters from posts
  const chapters = await Promise.all(posts.map(async (post, i) => {
    const [chapter] = await db.insert(ebookChaptersTable).values({
      ebook_id: req.params.id,
      blog_post_id: post.id,
      title: post.title,
      order_index: autoOrder ? i : i,
      content: post.content,
      is_generated: true,
    }).returning();
    return chapter;
  }));

  // Update word count estimate
  const totalWords = posts.reduce((acc, p) => acc + (p.content?.split(/\s+/).length || 0), 0);
  await db.update(ebooksTable).set({ word_count: totalWords, updated_at: new Date() }).where(eq(ebooksTable.id, req.params.id));

  const [updatedEbook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, req.params.id));
  res.json({ ebook: updatedEbook, chapters });
});

router.post("/ebooks/:id/export-pdf", async (req, res) => {
  // PDF export placeholder — will integrate puppeteer or pdfkit in production
  const [ebook] = await db.select().from(ebooksTable).where(eq(ebooksTable.id, req.params.id));
  if (!ebook) { res.status(404).json({ error: "Not found" }); return; }
  // Mark as print-ready
  await db.update(ebooksTable).set({ print_ready: true, updated_at: new Date() }).where(eq(ebooksTable.id, req.params.id));
  res.json({ pdf_url: null, epub_url: null, message: "PDF export queued. Integration with a PDF engine (puppeteer/pdfkit) required to generate the file.", status: "queued" });
});

export default router;
