import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const designsTable = pgTable("designs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  image_url: text("image_url").notNull(),
  category: text("category").notNull().default("T-Shirts"),
  tags: text("tags").array().default([]),
  teepublic_url: text("teepublic_url"),
  redbubble_url: text("redbubble_url"),
  amazon_url: text("amazon_url"),
  etsy_url: text("etsy_url"),
  featured: boolean("featured").default(false),
  source: text("source"),
  external_id: text("external_id").unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertDesignSchema = createInsertSchema(designsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type Design = typeof designsTable.$inferSelect;
