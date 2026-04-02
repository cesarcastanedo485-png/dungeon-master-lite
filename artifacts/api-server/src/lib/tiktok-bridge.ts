import { WebcastPushConnection } from "tiktok-live-connector";
import { logger } from "./logger.js";
import { broadcast } from "./sse-broadcast.js";
import { db, charactersTable, gameStateTable, narrativeTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  VALID_RACES,
  VALID_CLASSES,
  getBaseStats,
  getStartingSkills,
  getStartingInventory,
  resolveSubChoice,
  getLevelForXp,
  getHpPerLevel,
} from "./game-rules.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { buildDmSystemPrompt } from "./game-rules.js";

interface TikTokState {
  connection: WebcastPushConnection | null;
  uniqueId: string | null;
  isConnected: boolean;
  chatCount: number;
  viewerCount: number;
  lastError: string | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
}

const MAX_RECONNECT_ATTEMPTS = 5;

const state: TikTokState = {
  connection: null,
  uniqueId: null,
  isConnected: false,
  chatCount: 0,
  viewerCount: 0,
  lastError: null,
  reconnectTimer: null,
  reconnectAttempts: 0,
};

function scheduleReconnect() {
  if (!state.uniqueId || state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  const delay = Math.min(2000 * Math.pow(2, state.reconnectAttempts), 30000);
  state.reconnectAttempts++;
  logger.debug(`TikTok reconnect attempt ${state.reconnectAttempts} in ${delay}ms`);
  state.reconnectTimer = setTimeout(async () => {
    if (!state.uniqueId) return;
    const result = await connect(state.uniqueId);
    if (!result.success) {
      scheduleReconnect();
    }
  }, delay);
}

function clearReconnect() {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
  state.reconnectAttempts = 0;
}

async function handleChatCommand(username: string, comment: string) {
  const trimmed = comment.trim();
  if (!trimmed.startsWith("!")) return;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  if (cmd === "!create" && parts.length >= 4) {
    const race = (parts[1] ?? "").toLowerCase();
    const charClass = (parts[2] ?? "").toLowerCase();
    const name = parts.slice(3).join(" ");

    if (
      !VALID_RACES.includes(race as (typeof VALID_RACES)[number]) ||
      !VALID_CLASSES.includes(charClass as (typeof VALID_CLASSES)[number])
    ) {
      broadcast({
        type: "tiktok-chat",
        username,
        message: `Invalid race/class. Races: ${VALID_RACES.join(", ")}. Classes: ${VALID_CLASSES.join(", ")}`,
      });
      return;
    }

    const stats = getBaseStats(race as (typeof VALID_RACES)[number]);
    const skills = getStartingSkills(charClass as (typeof VALID_CLASSES)[number]);
    const inventory = getStartingInventory(charClass as (typeof VALID_CLASSES)[number]);
    const resolvedSubChoice = resolveSubChoice(race, charClass);

    const [char] = await db
      .insert(charactersTable)
      .values({
        username,
        name,
        race,
        class: charClass,
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
      })
      .returning();

    if (char) {
      broadcast({
        type: "tiktok-chat",
        username,
        message: `${name} the ${race} ${charClass} has been created! Activate them from the Characters tab.`,
      });
      broadcast({ type: "navigate", to: "characters" });
    }
    return;
  }

  if (cmd === "!action") {
    const action = parts.slice(1).join(" ");
    if (!action) return;

    const [gs] = await db.select().from(gameStateTable).limit(1);
    if (!gs || gs.status !== "active") {
      broadcast({
        type: "tiktok-chat",
        username,
        message: "Game is not active.",
      });
      return;
    }

    const activeParty = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.status, "active"));
    const player = activeParty.find(
      (c) => c.username.toLowerCase() === username.toLowerCase()
    );
    if (!player) {
      broadcast({
        type: "tiktok-chat",
        username,
        message: "You don't have an active character.",
      });
      return;
    }

    await db.insert(narrativeTable).values({
      type: "player",
      username,
      content: `${player.name}: ${action}`,
    });

    const dmName = gs.dmName ?? "The Dungeon Master";
    const systemPrompt = buildDmSystemPrompt(
      activeParty.map((c) => ({
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

    const recentNarrative = await db
      .select()
      .from(narrativeTable)
      .orderBy(narrativeTable.createdAt)
      .limit(20);

    const chatMessages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[] = [
      { role: "system", content: systemPrompt },
      ...recentNarrative.slice(0, -1).map((n) => ({
        role: n.type === "player" ? ("user" as const) : ("assistant" as const),
        content: n.content,
      })),
      {
        role: "user",
        content: `${player.name} (${player.race} ${player.class}): ${action}`,
      },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 8192,
        messages: chatMessages,
      });

      let fullResponse = response.choices[0]?.message?.content ?? "";

      const xpMatch = fullResponse.match(/AWARD_XP:(\d+)/);
      if (xpMatch) {
        const xpAmount = parseInt(xpMatch[1] ?? "0", 10);
        for (const char of activeParty) {
          const newXp = char.xp + xpAmount;
          const newLevel = getLevelForXp(newXp);
          const leveledUp = newLevel > char.level;
          const newMaxHp = leveledUp
            ? char.maxHp +
              getHpPerLevel(
                char.class as Parameters<typeof getHpPerLevel>[0]
              )
            : char.maxHp;
          const newHp = leveledUp ? newMaxHp : char.hp;
          await db
            .update(charactersTable)
            .set({ xp: newXp, level: newLevel, hp: newHp, maxHp: newMaxHp })
            .where(eq(charactersTable.id, char.id));
        }
        fullResponse = fullResponse
          .replace(/\nAWARD_XP:\d+/, "")
          .replace(/AWARD_XP:\d+/, "");
      }

      await db.insert(narrativeTable).values({
        type: "dm",
        content: fullResponse,
      });

      await db
        .update(gameStateTable)
        .set({
          storyContext: fullResponse.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(gameStateTable.id, gs.id));

      broadcast({ type: "narrative-update" });
    } catch (err) {
      logger.error("TikTok action DM error:", err);
      broadcast({
        type: "tiktok-chat",
        username,
        message: "The Dungeon Master encountered an error.",
      });
    }
    return;
  }

  const LOOKUP_TERMS = new Set<string>([
    ...VALID_RACES,
    ...VALID_CLASSES,
  ]);
  const lookupMatch = trimmed.match(/^!(\w+)$/i);
  const lookupTerm = lookupMatch?.[1]?.toLowerCase() ?? "";
  if (lookupMatch && LOOKUP_TERMS.has(lookupTerm)) {
    broadcast({ type: "lookup", term: lookupTerm });
    return;
  }

  if (cmd === "!party") {
    broadcast({ type: "navigate", to: "characters" });
    return;
  }

  if (cmd === "!sheet") {
    broadcast({ type: "navigate", to: "characters" });
    return;
  }
}

export async function connect(uniqueId: string): Promise<{ success: boolean; error?: string }> {
  if (state.isConnected) {
    await disconnect();
  }

  try {
    const connection = new WebcastPushConnection(uniqueId, {
      processInitialData: true,
      enableExtendedGiftInfo: false,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000,
    });

    await connection.connect();

    state.connection = connection;
    state.uniqueId = uniqueId;
    state.isConnected = true;
    state.chatCount = 0;
    state.lastError = null;
    clearReconnect();

    connection.on("chat", (data: { uniqueId: string; comment: string }) => {
      state.chatCount++;
      broadcast({
        type: "tiktok-chat",
        username: data.uniqueId,
        message: data.comment,
      });

      handleChatCommand(data.uniqueId, data.comment).catch((err) =>
        logger.error("TikTok command error:", err)
      );
    });

    connection.on("roomUser", (data: { viewerCount?: number }) => {
      if (data.viewerCount !== undefined) {
        state.viewerCount = data.viewerCount;
      }
    });

    connection.on("streamEnd", () => {
      state.isConnected = false;
      state.connection = null;
      state.lastError = "Stream ended";
      broadcast({
        type: "tiktok-status",
        status: "disconnected",
        reason: "Stream ended",
      });
      scheduleReconnect();
    });

    connection.on("disconnected", () => {
      state.isConnected = false;
      state.connection = null;
      broadcast({
        type: "tiktok-status",
        status: "disconnected",
        reason: "Connection lost",
      });
      scheduleReconnect();
    });

    broadcast({
      type: "tiktok-status",
      status: "connected",
      uniqueId,
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    state.lastError = message;
    state.isConnected = false;
    return { success: false, error: message };
  }
}

export async function disconnect(): Promise<void> {
  clearReconnect();
  if (state.connection) {
    try {
      state.connection.disconnect();
    } catch {
      // ignore
    }
    state.connection = null;
  }
  state.isConnected = false;
  state.uniqueId = null;
  state.viewerCount = 0;
  broadcast({ type: "tiktok-status", status: "disconnected" });
}

export function getStatus() {
  return {
    isConnected: state.isConnected,
    uniqueId: state.uniqueId,
    chatCount: state.chatCount,
    viewerCount: state.viewerCount,
    lastError: state.lastError,
  };
}
