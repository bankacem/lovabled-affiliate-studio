import { pgTable, text, boolean, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ebooksTable = pgTable("ebooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description"),
  author_name: text("author_name").notNull().default("AIPrintVerse"),
  cover_image: text("cover_image"),
  language: text("language").notNull().default("en"),
  category: text("category").notNull().default("General"),
  tags: text("tags").array().default([]),
  status: text("status").notNull().default("draft"),
  pdf_url: text("pdf_url"),
  epub_url: text("epub_url"),
  isbn: text("isbn"),
  publisher: text("publisher"),
  edition: text("edition"),
  page_count: integer("page_count"),
  word_count: integer("word_count"),
  meta_title: text("meta_title"),
  meta_description: text("meta_description"),
  kdp_asin: text("kdp_asin"),
  gumroad_id: text("gumroad_id"),
  lulu_id: text("lulu_id"),
  print_ready: boolean("print_ready").default(false),
  layout_config: jsonb("layout_config").default({}),
  published_at: timestamp("published_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const ebookChaptersTable = pgTable("ebook_chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  ebook_id: uuid("ebook_id").notNull().references(() => ebooksTable.id, { onDelete: "cascade" }),
  blog_post_id: uuid("blog_post_id"),
  title: text("title").notNull(),
  order_index: integer("order_index").notNull().default(0),
  content: text("content"),
  is_generated: boolean("is_generated").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertEbookSchema = createInsertSchema(ebooksTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertEbook = z.infer<typeof insertEbookSchema>;
export type Ebook = typeof ebooksTable.$inferSelect;

export const insertEbookChapterSchema = createInsertSchema(ebookChaptersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertEbookChapter = z.infer<typeof insertEbookChapterSchema>;
export type EbookChapter = typeof ebookChaptersTable.$inferSelect;
