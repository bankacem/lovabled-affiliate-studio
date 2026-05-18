import { pgTable, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { designsTable } from "./designs";

export const blogCategoriesTable = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const blogPostsTable = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  featured_image: text("featured_image"),
  author_id: text("author_id"),
  author_name: text("author_name").notNull().default("Admin"),
  category: text("category").notNull().default("General"),
  tags: text("tags").array().default([]),
  keywords: text("keywords").array().default([]),
  status: text("status").notNull().default("draft"),
  read_time: text("read_time").default("5 min read"),
  meta_title: text("meta_title"),
  meta_description: text("meta_description"),
  related_designs: text("related_designs").array().default([]),
  published_at: timestamp("published_at", { withTimezone: true }),
  scheduled_publish_at: timestamp("scheduled_publish_at", { withTimezone: true }),
  view_count: integer("view_count").default(0),
  source: text("source").notNull().default("manual"),
  template_id: text("template_id"),
  generation_batch: text("generation_batch"),
  design_id: uuid("design_id").references(() => designsTable.id),
  indexing_status: text("indexing_status").notNull().default("pending"),
  ebook_ready: boolean("ebook_ready").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategoriesTable).omit({ id: true, created_at: true });
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategoriesTable.$inferSelect;

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;
