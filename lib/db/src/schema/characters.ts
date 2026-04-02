import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charactersTable = pgTable("characters", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name").notNull(),
  race: text("race").notNull(),
  class: text("class").notNull(),
  status: text("status").notNull().default("pending"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  hp: integer("hp").notNull().default(10),
  maxHp: integer("max_hp").notNull().default(10),
  strength: integer("strength").notNull().default(10),
  dexterity: integer("dexterity").notNull().default(10),
  constitution: integer("constitution").notNull().default(10),
  intelligence: integer("intelligence").notNull().default(10),
  wisdom: integer("wisdom").notNull().default(10),
  charisma: integer("charisma").notNull().default(10),
  subChoice: text("sub_choice"),
  inventoryJson: text("inventory_json").notNull().default("[]"),
  skillsJson: text("skills_json").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
