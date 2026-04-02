import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameStateTable = pgTable("game_state", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("idle"),
  activeCharacterIds: text("active_character_ids").notNull().default("[]"),
  storyContext: text("story_context"),
  dmName: text("dm_name"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameStateSchema = createInsertSchema(gameStateTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameStateTable.$inferSelect;
