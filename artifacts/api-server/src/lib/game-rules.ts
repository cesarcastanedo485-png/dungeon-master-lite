// D&D game rules and constants

export const VALID_RACES = ["tiefling", "dragonborn", "human", "elf", "halfling", "gnome"] as const;
export const VALID_CLASSES = ["wizard", "cleric", "fighter", "rogue", "hunter"] as const;

export type Race = typeof VALID_RACES[number];
export type Class = typeof VALID_CLASSES[number];

// XP thresholds for each level (5e-inspired simplified)
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export function getLevelForXp(xp: number): number {
  let level = 1;
  for (let lvl = 20; lvl >= 1; lvl--) {
    if (xp >= (XP_THRESHOLDS[lvl] ?? 0)) {
      level = lvl;
      break;
    }
  }
  return level;
}

// Starting stats based on race
export function getBaseStats(race: Race): {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hp: number;
  maxHp: number;
} {
  const base = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };

  switch (race) {
    case "tiefling":
      return { ...base, intelligence: 11, charisma: 12, hp: 8, maxHp: 8 };
    case "dragonborn":
      return { ...base, strength: 12, charisma: 11, hp: 10, maxHp: 10 };
    case "human":
      return {
        strength: 11, dexterity: 11, constitution: 11,
        intelligence: 11, wisdom: 11, charisma: 11,
        hp: 10, maxHp: 10
      };
    case "elf":
      return { ...base, dexterity: 12, intelligence: 11, hp: 8, maxHp: 8 };
    case "halfling":
      return { ...base, dexterity: 12, charisma: 11, hp: 8, maxHp: 8 };
    case "gnome":
      return { ...base, intelligence: 12, constitution: 11, hp: 8, maxHp: 8 };
    default:
      return { ...base, hp: 8, maxHp: 8 };
  }
}

// Starting skills based on class
export function getStartingSkills(charClass: Class): string[] {
  switch (charClass) {
    case "wizard":
      return ["Arcane Magic", "Spellcasting (Cantrips)", "Arcane Recovery"];
    case "cleric":
      return ["Divine Magic", "Healing Word", "Channel Divinity"];
    case "fighter":
      return ["Fighting Style", "Second Wind", "Martial Weapons"];
    case "rogue":
      return ["Sneak Attack (1d6)", "Thieves' Tools", "Cunning Action"];
    case "hunter":
      return ["Favored Enemy", "Natural Explorer", "Hunter's Mark"];
    default:
      return [];
  }
}

// Starting inventory based on class
export function getStartingInventory(charClass: Class): string[] {
  switch (charClass) {
    case "wizard":
      return ["Spellbook", "Arcane Focus", "Scholar's Pack", "Dagger"];
    case "cleric":
      return ["Holy Symbol", "Chain Mail", "Shield", "Mace", "Priest's Pack"];
    case "fighter":
      return ["Chain Mail", "Longsword", "Shield", "Explorer's Pack"];
    case "rogue":
      return ["Leather Armor", "Shortsword", "Thieves' Tools", "Burglar's Pack"];
    case "hunter":
      return ["Leather Armor", "Longbow", "Quiver (20 arrows)", "Shortsword", "Explorer's Pack"];
    default:
      return ["Backpack", "Bedroll", "Rations (5 days)"];
  }
}

// HP per level by class
export function getHpPerLevel(charClass: Class): number {
  switch (charClass) {
    case "fighter": return 10;
    case "cleric": return 8;
    case "rogue": return 8;
    case "hunter": return 10;
    case "wizard": return 6;
    default: return 8;
  }
}

// Sub-choice options per race/class (for things that imply a selection)
export const SUB_CHOICE_OPTIONS: Partial<Record<string, string[]>> = {
  dragonborn:  ["fire", "cold", "lightning", "acid", "poison", "thunder"],
  cleric:      ["Life", "War", "Knowledge", "Nature", "Trickery"],
  fighter:     ["Dueling", "Defense", "Archery"],
  wizard:      ["Evocation", "Divination", "Necromancy"],
  rogue:       ["Thief", "Assassin", "Arcane Trickster"],
  hunter:      ["Undead", "Beasts", "Humanoids", "Fiends", "Dragons"],
};

// Sub-choice labels shown to the user
export const SUB_CHOICE_LABELS: Partial<Record<string, string>> = {
  dragonborn: "Dragon Ancestry",
  cleric:     "Divine Domain",
  fighter:    "Fighting Style",
  wizard:     "Arcane Tradition",
  rogue:      "Roguish Archetype",
  hunter:     "Favored Enemy",
};

// Resolve a sub-choice, picking a default if missing/invalid
export function resolveSubChoice(
  race: string,
  charClass: string,
  provided?: string
): string | null {
  // Check race-level option (Dragonborn)
  const raceOpts = SUB_CHOICE_OPTIONS[race];
  if (raceOpts) {
    if (provided && raceOpts.map(o => o.toLowerCase()).includes(provided.toLowerCase())) {
      return provided.toLowerCase();
    }
    return raceOpts[0]?.toLowerCase() ?? null; // default to first
  }
  // Check class-level option
  const classOpts = SUB_CHOICE_OPTIONS[charClass];
  if (classOpts) {
    if (provided && classOpts.map(o => o.toLowerCase()).includes(provided.toLowerCase())) {
      const match = classOpts.find(o => o.toLowerCase() === provided.toLowerCase());
      return match ?? classOpts[0] ?? null;
    }
    return classOpts[0] ?? null; // default to first
  }
  return null;
}

// Human-readable label for a sub-choice used in the DM prompt
function formatSubChoiceForDm(race: string, charClass: string, subChoice: string | undefined | null): string {
  if (!subChoice) return "";
  const label = SUB_CHOICE_LABELS[race] ?? SUB_CHOICE_LABELS[charClass];
  if (!label) return "";
  return ` [${label}: ${subChoice}]`;
}

// Build DM system prompt from current party and optional custom DM name
export function buildDmSystemPrompt(
  party: Array<{
    username: string;
    name: string;
    race: string;
    class: string;
    level: number;
    hp: number;
    maxHp: number;
    skills: string[];
    subChoice?: string | null;
  }>,
  dmName: string = "The Dungeon Master"
): string {
  const partyDesc = party.length === 0
    ? "No party members yet."
    : party.map(c => {
        const subChoiceInfo = formatSubChoiceForDm(c.race, c.class, c.subChoice);
        return `- ${c.name} (${c.username}): Level ${c.level} ${c.race} ${c.class}${subChoiceInfo}, HP ${c.hp}/${c.maxHp}, Skills: ${c.skills.join(", ")}`;
      }).join("\n");

  return `You are ${dmName}, a wildly entertaining, character-obsessed Dungeon Master running a Dungeons & Dragons adventure. This campaign was crafted by Mortyy himself — a legend.

Current Party:
${partyDesc}

Core directives — read these carefully:

PERSONALITY & TONE
- You have a rich, distinct personality: witty, dramatic, occasionally mischievous. You LOVE these characters and it shows.
- Be dynamic. Switch between tense gravitas and dark humor naturally. You are NOT a boring rule reciter.
- Reference the characters by their NAMES constantly. Call them out directly. Make them feel seen.
  Examples: "Maximus, the blood on your blade is still warm when you hear it..." or "Luna — and you specifically, Luna — feel a chill."
- Weave in personal character details: a rogue's shady past, a cleric's god, a wizard's quirks. Make the story THEIRS.
- If a character's hometown, backstory hint, or class lore is relevant, USE it. "Aren't you from the Eastern Reaches, Kira? This crest... it looks familiar."

NARRATION & CREATIVITY
- Narrate vividly — smells, sounds, textures, emotional weight. Make the world breathe.
- Simulate dice rolls with flair: "The d20 skips across the stone... and lands on a 19. Oh, that's going to hurt someone."
- Results should feel earned. A nat-20 should feel glorious. A nat-1 should be hilariously catastrophic.
- Go off-script when the story demands it. If a player does something unexpected and brilliant, reward the creativity.
- Allow morally grey choices. Betrayal, dark bargains, questionable alliances — all fair game.

MATURE CONTENT
- This is an adult adventure. You may include violence, gritty atmosphere, dark themes, crude language, and adult situations when the story naturally leads there. Do not sanitize the world.
- Keep explicit content tasteful unless players push clearly in that direction — then follow the story where it leads.
- Never shy away from tension, loss, or genuine danger. Characters can be hurt, humiliated, or face real consequences.

XP & MECHANICS
- Award XP for encounters: minor (50-100 XP), moderate (100-300 XP), major (300-500 XP).
- When awarding XP, append exactly: AWARD_XP:[amount] at the very end of your response (e.g. AWARD_XP:150). No other format.
- Use class abilities naturally in the fiction — rogue sneak attacks feel sneaky, cleric healing feels divine, wizard spells feel arcane and costly.

HARD RULES
- Never break character as ${dmName}. The fourth wall is sacred. Do not reference TikTok, streaming, the internet, or modern concepts.
- Keep responses to 2-4 punchy paragraphs. Atmospheric, not exhausting.
- This is a timeless fantasy world. You are ${dmName}. Act like it.`;
}
