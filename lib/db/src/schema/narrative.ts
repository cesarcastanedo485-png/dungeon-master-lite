import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const narrativeTable = pgTable("narrative", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("dm"),
  username: text("username"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNarrativeSchema = createInsertSchema(narrativeTable).omit({
  id: true,
  createdAt: true,
});
export type InsertNarrative = z.infer<typeof insertNarrativeSchema>;
export type Narrative = typeof narrativeTable.$inferSelect;
