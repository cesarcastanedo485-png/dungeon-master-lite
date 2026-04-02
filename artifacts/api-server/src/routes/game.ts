import { Router, type IRouter } from "express";
import { logger } from "../lib/logger.js";
import { eq } from "drizzle-orm";
import { db, gameStateTable, narrativeTable, charactersTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { buildDmSystemPrompt } from "../lib/game-rules.js";
import { getLevelForXp, getHpPerLevel, VALID_RACES, VALID_CLASSES } from "../lib/game-rules.js";
import { addClient, broadcast } from "../lib/sse-broadcast.js";

const router: IRouter = Router();

// Helper: serialize game state for API response
function serializeState(state: typeof gameStateTable.$inferSelect) {
  return {
    status: state.status,
    activeCharacterIds: JSON.parse(state.activeCharacterIds) as number[],
    storyContext: state.storyContext ?? undefined,
    dmName: state.dmName ?? undefined,
    updatedAt: state.updatedAt.toISOString(),
  };
}

// Helper: get or create game state
async function getOrCreateGameState() {
  const [state] = await db.select().from(gameStateTable).limit(1);
  if (state) return state;
  const [newState] = await db.insert(gameStateTable).values({
    status: "idle",
    activeCharacterIds: "[]",
  }).returning();
  return newState;
}

// Helper: get active party characters
async function getActiveParty() {
  const state = await getOrCreateGameState();
  const ids: number[] = JSON.parse(state.activeCharacterIds);
  if (ids.length === 0) return [];
  return await db.select().from(charactersTable).where(
    eq(charactersTable.status, "active")
  );
}

// GET /game/state
router.get("/game/state", async (_req, res): Promise<void> => {
  const state = await getOrCreateGameState();
  res.json(serializeState(state));
});

// POST /game/generate-dm-name - use AI to generate a thematic DM name
router.post("/game/generate-dm-name", async (_req, res): Promise<void> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Generate a single creative, fantasy-themed Dungeon Master name like "Eldric the Chronicler", "Vareth the Unseen", "Miravel the Sage", or "Thorne the Undying". Reply with ONLY the name itself, nothing else. Make it sound ancient, wise, or mysterious.`,
        },
      ],
    });

    const dmName = response.choices[0]?.message?.content?.trim() ?? "Eldric the Chronicler";

    // Store in game state
    const state = await getOrCreateGameState();
    await db.update(gameStateTable)
      .set({ dmName, updatedAt: new Date() })
      .where(eq(gameStateTable.id, state.id));

    res.json({ dmName });
  } catch (err) {
    logger.error("DM name generation error:", err);
    res.json({ dmName: "Eldric the Chronicler" });
  }
});

// POST /game/start
router.post("/game/start", async (_req, res): Promise<void> => {
  const [state] = await db.select().from(gameStateTable).limit(1);

  if (state) {
    await db.update(gameStateTable)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(gameStateTable.id, state.id));
  } else {
    await db.insert(gameStateTable).values({
      status: "active",
      activeCharacterIds: "[]",
    });
  }

  const updated = await getOrCreateGameState();
  res.json(serializeState(updated));
});

// POST /game/pause
router.post("/game/pause", async (_req, res): Promise<void> => {
  const state = await getOrCreateGameState();
  await db.update(gameStateTable)
    .set({ status: "paused", updatedAt: new Date() })
    .where(eq(gameStateTable.id, state.id));

  const updated = await getOrCreateGameState();
  res.json(serializeState(updated));
});

// POST /game/reset
router.post("/game/reset", async (_req, res): Promise<void> => {
  const state = await getOrCreateGameState();
  await db.update(gameStateTable)
    .set({ status: "idle", storyContext: null, dmName: null, updatedAt: new Date() })
    .where(eq(gameStateTable.id, state.id));

  // Clear all characters' active status
  await db.update(charactersTable)
    .set({ status: "pending" })
    .where(eq(charactersTable.status, "active"));

  // Clear narrative
  await db.delete(narrativeTable);

  const updated = await getOrCreateGameState();
  res.json(serializeState(updated));
});

// GET /game/narrative
router.get("/game/narrative", async (_req, res): Promise<void> => {
  const entries = await db.select().from(narrativeTable).orderBy(narrativeTable.createdAt);
  res.json(entries.map(e => ({
    id: e.id,
    type: e.type,
    username: e.username ?? undefined,
    content: e.content,
    createdAt: e.createdAt.toISOString(),
  })));
});

// POST /game/action - SSE streaming DM response
router.post("/game/action", async (req, res): Promise<void> => {
  const { username, action } = req.body as { username?: string; action?: string };

  if (!username || !action) {
    res.status(400).json({ error: "username and action are required" });
    return;
  }

  const state = await getOrCreateGameState();

  if (state.status !== "active") {
    res.status(400).json({ error: "Game is not active. Start the game first." });
    return;
  }

  // Check if username is an active player
  const activeParty = await getActiveParty();
  const player = activeParty.find(c => c.username.toLowerCase() === username.toLowerCase());

  if (!player) {
    res.status(403).json({ error: "You are not an active player. Wait for your turn or join when paused." });
    return;
  }

  // Save player action to narrative
  await db.insert(narrativeTable).values({
    type: "player",
    username,
    content: `${player.name}: ${action}`,
  });

  const dmName = state.dmName ?? "The Dungeon Master";

  // Build DM system prompt with DM name
  const systemPrompt = buildDmSystemPrompt(
    activeParty.map(c => ({
      username: c.username,
      name: c.name,
      race: c.race,
      class: c.class,
      level: c.level,
      hp: c.hp,
      maxHp: c.maxHp,
      skills: JSON.parse(c.skillsJson) as string[],
      subChoice: c.subChoice,
    })),
    dmName
  );

  // Get recent narrative for context
  const recentNarrative = await db.select().from(narrativeTable)
    .orderBy(narrativeTable.createdAt)
    .limit(20);

  const chatMessages: { role: "user" | "assistant" | "system"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...recentNarrative.slice(0, -1).map(n => ({
      role: n.type === "player" ? ("user" as const) : ("assistant" as const),
      content: n.content,
    })),
    { role: "user", content: `${player.name} (${player.race} ${player.class}): ${action}` },
  ];

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Parse XP award from response
    const xpMatch = fullResponse.match(/AWARD_XP:(\d+)/);
    if (xpMatch) {
      const xpAmount = parseInt(xpMatch[1] ?? "0", 10);
      // Award XP to all active players
      for (const char of activeParty) {
        const newXp = char.xp + xpAmount;
        const newLevel = getLevelForXp(newXp);
        const leveledUp = newLevel > char.level;
        const newMaxHp = leveledUp
          ? char.maxHp + getHpPerLevel(char.class as Parameters<typeof getHpPerLevel>[0])
          : char.maxHp;
        const newHp = leveledUp ? newMaxHp : char.hp;

        await db.update(charactersTable)
          .set({ xp: newXp, level: newLevel, hp: newHp, maxHp: newMaxHp })
          .where(eq(charactersTable.id, char.id));
      }
      fullResponse = fullResponse.replace(/\nAWARD_XP:\d+/, "").replace(/AWARD_XP:\d+/, "");
    }

    // Save DM response to narrative
    await db.insert(narrativeTable).values({
      type: "dm",
      content: fullResponse,
    });

    // Update story context
    await db.update(gameStateTable)
      .set({ storyContext: fullResponse.slice(0, 500), updatedAt: new Date() })
      .where(eq(gameStateTable.id, state.id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error("DM stream error:", err);
    res.write(`data: ${JSON.stringify({ error: "The Dungeon Master encountered an error." })}\n\n`);
    res.end();
  }
});

// POST /game/intro - Generate opening narrative when game starts
router.post("/game/intro", async (_req, res): Promise<void> => {
  const state = await getOrCreateGameState();
  if (state.status !== "active") {
    res.status(400).json({ error: "Game must be active" });
    return;
  }

  const activeParty = await getActiveParty();
  const dmName = state.dmName ?? "The Dungeon Master";

  const systemPrompt = buildDmSystemPrompt(
    activeParty.map(c => ({
      username: c.username,
      name: c.name,
      race: c.race,
      class: c.class,
      level: c.level,
      hp: c.hp,
      maxHp: c.maxHp,
      skills: JSON.parse(c.skillsJson) as string[],
      subChoice: c.subChoice,
    })),
    dmName
  );

  const partyIntro = activeParty.length > 0
    ? `Party of ${activeParty.length} adventurer(s): ${activeParty.map(c => `${c.name} the ${c.race} ${c.class}`).join(", ")}.`
    : "A lone wanderer.";

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Begin the adventure! ${partyIntro} Set the opening scene — a tavern, a mysterious quest board, an urgent summons, or another classic D&D hook. Make it atmospheric and exciting. Introduce yourself as ${dmName}. End with a clear choice or prompt for the party to act.` },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save intro to narrative
    await db.insert(narrativeTable).values({
      type: "dm",
      content: fullResponse,
    });

    await db.update(gameStateTable)
      .set({ storyContext: fullResponse.slice(0, 500), updatedAt: new Date() })
      .where(eq(gameStateTable.id, state.id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error("Intro stream error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate intro." })}\n\n`);
    res.end();
  }
});

const VALID_LOOKUP_TERMS = new Set<string>([
  ...VALID_RACES,
  ...VALID_CLASSES,
]);

router.get("/events", (_req, res): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  addClient(res);
});

router.post("/game/lookup", (req, res): void => {
  const { term } = req.body as { term?: string };

  if (!term || typeof term !== "string") {
    res.status(400).json({ error: "term is required" });
    return;
  }

  const normalized = term.toLowerCase().trim();

  if (!VALID_LOOKUP_TERMS.has(normalized)) {
    res.status(404).json({ error: `Unknown term: ${term}` });
    return;
  }

  broadcast({ type: "lookup", term: normalized });
  res.json({ ok: true, term: normalized });
});

export default router;
