import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Stores named campaign saves (full game state snapshots)
export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dmName: text("dm_name").notNull().default("The Chronicler"),
  gameStatus: text("game_status").notNull().default("paused"),
  storyContext: text("story_context"),
  narrativeJson: text("narrative_json").notNull().default("[]"),
  charactersJson: text("characters_json").notNull().default("[]"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({
  id: true,
  savedAt: true,
});
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
