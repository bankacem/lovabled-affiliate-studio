import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { blogPostsTable } from "./blog";

export const pageViewsTable = pgTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  page_path: text("page_path").notNull(),
  page_title: text("page_title"),
  referrer: text("referrer"),
  user_agent: text("user_agent"),
  session_id: text("session_id"),
  post_id: uuid("post_id").references(() => blogPostsTable.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const linkTrackingTable = pgTable("link_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  source_post_id: uuid("source_post_id").references(() => blogPostsTable.id, { onDelete: "cascade" }),
  target_url: text("target_url").notNull(),
  link_text: text("link_text"),
  link_type: text("link_type").notNull().default("external"),
  click_count: integer("click_count").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const autoLinkKeywordsTable = pgTable("auto_link_keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: text("keyword").notNull(),
  target_post_id: uuid("target_post_id").references(() => blogPostsTable.id, { onDelete: "cascade" }),
  priority: integer("priority").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertPageViewSchema = createInsertSchema(pageViewsTable).omit({ id: true, created_at: true });
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViewsTable.$inferSelect;

export const insertLinkTrackingSchema = createInsertSchema(linkTrackingTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertLinkTracking = z.infer<typeof insertLinkTrackingSchema>;
export type LinkTracking = typeof linkTrackingTable.$inferSelect;

export const insertAutoLinkKeywordSchema = createInsertSchema(autoLinkKeywordsTable).omit({ id: true, created_at: true });
export type InsertAutoLinkKeyword = z.infer<typeof insertAutoLinkKeywordSchema>;
export type AutoLinkKeyword = typeof autoLinkKeywordsTable.$inferSelect;
