import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, charactersTable, gameStateTable } from "@workspace/db";
import {
  VALID_RACES,
  VALID_CLASSES,
  getBaseStats,
  getStartingSkills,
  getStartingInventory,
  resolveSubChoice,
} from "../lib/game-rules.js";

const router: IRouter = Router();

// Helper: serialize character for response
function serializeChar(c: typeof charactersTable.$inferSelect) {
  return {
    id: c.id,
    username: c.username,
    name: c.name,
    race: c.race,
    class: c.class,
    status: c.status,
    level: c.level,
    xp: c.xp,
    hp: c.hp,
    maxHp: c.maxHp,
    strength: c.strength,
    dexterity: c.dexterity,
    constitution: c.constitution,
    intelligence: c.intelligence,
    wisdom: c.wisdom,
    charisma: c.charisma,
    subChoice: c.subChoice ?? undefined,
    inventory: JSON.parse(c.inventoryJson) as string[],
    skills: JSON.parse(c.skillsJson) as string[],
    createdAt: c.createdAt.toISOString(),
  };
}

// GET /characters
router.get("/characters", async (_req, res): Promise<void> => {
  const chars = await db.select().from(charactersTable).orderBy(charactersTable.createdAt);
  res.json(chars.map(serializeChar));
});

// POST /characters/create
router.post("/characters/create", async (req, res): Promise<void> => {
  const { username, name, race, class: charClass, subChoice } = req.body as {
    username?: string;
    name?: string;
    race?: string;
    class?: string;
    subChoice?: string;
  };

  if (!username || !name || !race || !charClass) {
    res.status(400).json({ error: "username, name, race, and class are required" });
    return;
  }

  const raceLower = race.toLowerCase();
  const classLower = charClass.toLowerCase();

  if (!VALID_RACES.includes(raceLower as typeof VALID_RACES[number])) {
    res.status(400).json({ error: `Invalid race. Valid races: ${VALID_RACES.join(", ")}` });
    return;
  }

  if (!VALID_CLASSES.includes(classLower as typeof VALID_CLASSES[number])) {
    res.status(400).json({ error: `Invalid class. Valid classes: ${VALID_CLASSES.join(", ")}` });
    return;
  }

  const stats = getBaseStats(raceLower as typeof VALID_RACES[number]);
  const skills = getStartingSkills(classLower as typeof VALID_CLASSES[number]);
  const inventory = getStartingInventory(classLower as typeof VALID_CLASSES[number]);

  // Validate sub-choice if provided
  const resolvedSubChoice = resolveSubChoice(raceLower as typeof VALID_RACES[number], classLower as typeof VALID_CLASSES[number], subChoice);

  const [char] = await db.insert(charactersTable).values({
    username,
    name,
    race: raceLower,
    class: classLower,
    status: "pending",
    level: 1,
    xp: 0,
    hp: stats.hp,
    maxHp: stats.maxHp,
    strength: stats.strength,
    dexterity: stats.dexterity,
    constitution: stats.constitution,
    intelligence: stats.intelligence,
    wisdom: stats.wisdom,
    charisma: stats.charisma,
    subChoice: resolvedSubChoice,
    inventoryJson: JSON.stringify(inventory),
    skillsJson: JSON.stringify(skills),
  }).returning();

  res.status(201).json(serializeChar(char!));
});

// GET /characters/:id
router.get("/characters/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
  if (!char) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  res.json(serializeChar(char));
});

// DELETE /characters/:id
router.delete("/characters/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [char] = await db.delete(charactersTable).where(eq(charactersTable.id, id)).returning();
  if (!char) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  // If was active, update game state
  if (char.status === "active") {
    const [state] = await db.select().from(gameStateTable).limit(1);
    if (state) {
      const ids: number[] = JSON.parse(state.activeCharacterIds);
      const newIds = ids.filter(i => i !== id);
      await db.update(gameStateTable)
        .set({ activeCharacterIds: JSON.stringify(newIds), updatedAt: new Date() })
        .where(eq(gameStateTable.id, state.id));
    }
  }

  res.sendStatus(204);
});

// POST /characters/:id/activate
router.post("/characters/:id/activate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
  if (!char) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  if (char.status === "active") {
    res.status(400).json({ error: "Character is already active" });
    return;
  }

  // Check party size
  const activeChars = await db.select().from(charactersTable).where(eq(charactersTable.status, "active"));
  if (activeChars.length >= 4) {
    res.status(400).json({ error: "Party is full (max 4 characters)" });
    return;
  }

  const [updated] = await db.update(charactersTable)
    .set({ status: "active" })
    .where(eq(charactersTable.id, id))
    .returning();

  // Update game state active ids
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (state) {
    const ids: number[] = JSON.parse(state.activeCharacterIds);
    if (!ids.includes(id)) {
      await db.update(gameStateTable)
        .set({ activeCharacterIds: JSON.stringify([...ids, id]), updatedAt: new Date() })
        .where(eq(gameStateTable.id, state.id));
    }
  }

  res.json(serializeChar(updated!));
});

// POST /characters/:id/deactivate
router.post("/characters/:id/deactivate", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
  if (!char) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const [updated] = await db.update(charactersTable)
    .set({ status: "pending" })
    .where(eq(charactersTable.id, id))
    .returning();

  // Remove from active ids
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (state) {
    const ids: number[] = JSON.parse(state.activeCharacterIds);
    const newIds = ids.filter(i => i !== id);
    await db.update(gameStateTable)
      .set({ activeCharacterIds: JSON.stringify(newIds), updatedAt: new Date() })
      .where(eq(gameStateTable.id, state.id));
  }

  res.json(serializeChar(updated!));
});

// POST /characters/:id/award-xp
router.post("/characters/:id/award-xp", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  const { amount } = req.body as { amount?: number };

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }

  const [char] = await db.select().from(charactersTable).where(eq(charactersTable.id, id));
  if (!char) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const { getLevelForXp, getHpPerLevel } = await import("../lib/game-rules.js");
  const newXp = char.xp + amount;
  const newLevel = getLevelForXp(newXp);
  const leveledUp = newLevel > char.level;
  const newMaxHp = leveledUp
    ? char.maxHp + getHpPerLevel(char.class as Parameters<typeof getHpPerLevel>[0])
    : char.maxHp;
  const newHp = leveledUp ? newMaxHp : char.hp;

  const [updated] = await db.update(charactersTable)
    .set({ xp: newXp, level: newLevel, hp: newHp, maxHp: newMaxHp })
    .where(eq(charactersTable.id, id))
    .returning();

  res.json(serializeChar(updated!));
});

export default router;
