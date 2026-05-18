import { pgTable, text, boolean, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articleTemplatesTable = pgTable("article_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  template_type: text("template_type").notNull().default("birthday"),
  title_template: text("title_template").notNull(),
  slug_template: text("slug_template").notNull(),
  content_template: text("content_template").notNull(),
  excerpt_template: text("excerpt_template"),
  category: text("category").notNull().default("General"),
  tags: text("tags").array().default([]),
  meta_title_template: text("meta_title_template"),
  meta_description_template: text("meta_description_template"),
  variables: jsonb("variables").default({}),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const generationBatchesTable = pgTable("generation_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_name: text("batch_name").notNull(),
  template_id: uuid("template_id").references(() => articleTemplatesTable.id),
  total_articles: integer("total_articles").notNull().default(0),
  generated_count: integer("generated_count").notNull().default(0),
  published_count: integer("published_count").notNull().default(0),
  status: text("status").notNull().default("pending"),
  variables_data: jsonb("variables_data").default({}),
  created_by: text("created_by"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertArticleTemplateSchema = createInsertSchema(articleTemplatesTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertArticleTemplate = z.infer<typeof insertArticleTemplateSchema>;
export type ArticleTemplate = typeof articleTemplatesTable.$inferSelect;

export const insertGenerationBatchSchema = createInsertSchema(generationBatchesTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertGenerationBatch = z.infer<typeof insertGenerationBatchSchema>;
export type GenerationBatch = typeof generationBatchesTable.$inferSelect;
