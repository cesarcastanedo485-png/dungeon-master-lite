import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable, gameStateTable, narrativeTable, charactersTable } from "@workspace/db";
import { SaveCampaignBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to serialize campaign
function serializeCampaign(c: typeof campaignsTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    dmName: c.dmName,
    gameStatus: c.gameStatus,
    storyContext: c.storyContext ?? undefined,
    narrativeJson: c.narrativeJson,
    charactersJson: c.charactersJson,
    savedAt: c.savedAt.toISOString(),
  };
}

// GET /campaigns - list all saves
router.get("/campaigns", async (_req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable).orderBy(campaignsTable.savedAt);
  res.json(campaigns.map(serializeCampaign));
});

// POST /campaigns - save current state
router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = SaveCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name } = parsed.data;

  // Snapshot current game state
  const [state] = await db.select().from(gameStateTable).limit(1);
  const narrative = await db.select().from(narrativeTable).orderBy(narrativeTable.createdAt);
  const characters = await db.select().from(charactersTable).orderBy(charactersTable.createdAt);

  const [campaign] = await db.insert(campaignsTable).values({
    name,
    dmName: state?.dmName ?? "The Chronicler",
    gameStatus: state?.status ?? "idle",
    storyContext: state?.storyContext ?? null,
    narrativeJson: JSON.stringify(narrative.map(n => ({
      type: n.type,
      username: n.username,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    }))),
    charactersJson: JSON.stringify(characters.map(c => ({
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
      inventoryJson: c.inventoryJson,
      skillsJson: c.skillsJson,
    }))),
  }).returning();

  res.status(201).json(serializeCampaign(campaign!));
});

// GET /campaigns/:id - get a specific save
router.get("/campaigns/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  res.json(serializeCampaign(campaign));
});

// DELETE /campaigns/:id - delete a save
router.delete("/campaigns/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  res.sendStatus(204);
});

// POST /campaigns/:id/load - restore a saved campaign
router.post("/campaigns/:id/load", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  // Wipe current state
  await db.delete(narrativeTable);
  await db.delete(charactersTable);

  // Restore characters
  const savedChars = JSON.parse(campaign.charactersJson) as Array<{
    username: string; name: string; race: string; class: string; status: string;
    level: number; xp: number; hp: number; maxHp: number;
    strength: number; dexterity: number; constitution: number;
    intelligence: number; wisdom: number; charisma: number;
    inventoryJson: string; skillsJson: string;
  }>;

  const restoredChars = savedChars.length > 0
    ? await db.insert(charactersTable).values(savedChars.map(c => ({
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
        inventoryJson: c.inventoryJson,
        skillsJson: c.skillsJson,
      }))).returning()
    : [];

  // Restore narrative
  const savedNarrative = JSON.parse(campaign.narrativeJson) as Array<{
    type: string; username?: string | null; content: string; createdAt: string;
  }>;
  if (savedNarrative.length > 0) {
    await db.insert(narrativeTable).values(savedNarrative.map(n => ({
      type: n.type,
      username: n.username ?? null,
      content: n.content,
    })));
  }

  // Update / create game state
  const activeIds = restoredChars
    .filter(c => c.status === "active")
    .map(c => c.id);

  const [existingState] = await db.select().from(gameStateTable).limit(1);
  if (existingState) {
    await db.update(gameStateTable).set({
      status: "paused",
      dmName: campaign.dmName,
      storyContext: campaign.storyContext,
      activeCharacterIds: JSON.stringify(activeIds),
      updatedAt: new Date(),
    }).where(eq(gameStateTable.id, existingState.id));
  } else {
    await db.insert(gameStateTable).values({
      status: "paused",
      dmName: campaign.dmName,
      storyContext: campaign.storyContext,
      activeCharacterIds: JSON.stringify(activeIds),
    });
  }

  const [updated] = await db.select().from(gameStateTable).limit(1);
  res.json({
    status: updated!.status,
    activeCharacterIds: JSON.parse(updated!.activeCharacterIds) as number[],
    storyContext: updated!.storyContext ?? undefined,
    dmName: updated!.dmName ?? undefined,
    updatedAt: updated!.updatedAt.toISOString(),
  });
});

export default router;
