import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  pgTable,
  serial,
  varchar,
  date,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  age_group: varchar("age_group", { length: 20 }).notNull(),
  category: varchar("category", { length: 100 }),
  event_date: date("event_date").notNull(),
  award: varchar("award", { length: 255 }).notNull(),
  description: text("description"),
  images: text("images").array(),
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

// Uploaded images are stored in the database (base64 in a text column) rather
// than on disk, so they survive on read-only/ephemeral serverless filesystems.
export const images = pgTable("images", {
  id: text("id").primaryKey(),
  content_type: varchar("content_type", { length: 100 }).notNull(),
  data: text("data").notNull(), // base64-encoded bytes
  created_at: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export type ImageRow = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql);
  }
  return _db;
}
