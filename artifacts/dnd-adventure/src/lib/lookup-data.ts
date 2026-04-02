export interface LookupEntry {
  type: "class" | "race";
  name: string;
  icon: string;
  desc: string;
  primaryStat?: string;
  traits?: string[];
  subChoiceLabel?: string;
  subChoiceOptions?: string[];
  skillHighlights: { level: number; name: string; icon: string; desc: string }[];
}

const LOOKUP_MAP: Record<string, LookupEntry> = {
  wizard: {
    type: "class",
    name: "Wizard",
    icon: "🔮",
    desc: "A scholarly magic-user capable of manipulating the very structures of reality through ancient arcane formulas.",
    primaryStat: "Intelligence",
    subChoiceLabel: "Arcane Tradition",
    subChoiceOptions: ["Evocation", "Divination", "Necromancy"],
    skillHighlights: [
      { level: 1, name: "Mage Hand", icon: "✋", desc: "Conjure a spectral hand to manipulate objects up to 30 ft away." },
      { level: 1, name: "Arcane Scholar", icon: "📚", desc: "+1 bonus to all Intelligence checks. Permanent." },
      { level: 3, name: "Fire Bolt", icon: "🔥", desc: "Hurl a bolt of fire dealing 1d10 fire damage." },
      { level: 3, name: "Magic Missile", icon: "🎯", desc: "Three unerring darts each dealing 1d4+1 force damage." },
    ],
  },
  cleric: {
    type: "class",
    name: "Cleric",
    icon: "✨",
    desc: "A priestly champion who wields divine magic in service of a higher power, healing allies and smiting foes.",
    primaryStat: "Wisdom",
    subChoiceLabel: "Divine Domain",
    subChoiceOptions: ["Life", "War", "Knowledge", "Nature", "Trickery"],
    skillHighlights: [
      { level: 1, name: "Sacred Flame", icon: "🔆", desc: "Call divine radiance down on a target for 1d8 radiant damage." },
      { level: 1, name: "Divine Favor", icon: "🙏", desc: "+1 bonus to all saving throws. Permanent." },
      { level: 3, name: "Cure Wounds", icon: "💚", desc: "Heal a touched creature for 1d8 + WIS modifier HP." },
      { level: 3, name: "Turn Undead", icon: "☀️", desc: "Force undead to flee for 1 minute." },
    ],
  },
  fighter: {
    type: "class",
    name: "Fighter",
    icon: "⚔️",
    desc: "A master of martial combat, skilled with a vast variety of weapons and armor — the unbreakable wall of any party.",
    primaryStat: "Strength or Dexterity",
    subChoiceLabel: "Fighting Style",
    subChoiceOptions: ["Dueling", "Defense", "Archery"],
    skillHighlights: [
      { level: 1, name: "Second Wind", icon: "💨", desc: "Heal yourself for 1d10 + fighter level as a bonus action." },
      { level: 1, name: "Fighting Style", icon: "🛡️", desc: "Choose: Dueling (+2 dmg), Defense (+1 AC), or Archery (+2 ranged)." },
      { level: 3, name: "Action Surge", icon: "⚡", desc: "Take one additional full action on your turn." },
      { level: 5, name: "Extra Attack", icon: "⚔️", desc: "Attack twice instead of once." },
    ],
  },
  rogue: {
    type: "class",
    name: "Rogue",
    icon: "🗡️",
    desc: "A scoundrel who uses stealth and trickery to overcome obstacles. Where others fight fair, the Rogue wins.",
    primaryStat: "Dexterity",
    subChoiceLabel: "Roguish Archetype",
    subChoiceOptions: ["Thief", "Assassin", "Arcane Trickster"],
    skillHighlights: [
      { level: 1, name: "Sneak Attack 1d6", icon: "🗡️", desc: "Deal +1d6 bonus damage with advantage or ally adjacent." },
      { level: 1, name: "Expertise", icon: "🎓", desc: "Double your proficiency bonus in two chosen skills." },
      { level: 3, name: "Cunning Action", icon: "💨", desc: "Dash, Disengage, or Hide as a bonus action." },
      { level: 5, name: "Uncanny Dodge", icon: "🛡️", desc: "Halve attack damage from a visible attacker." },
    ],
  },
  hunter: {
    type: "class",
    name: "Hunter",
    icon: "🏹",
    desc: "A warrior who combines martial prowess and nature magic. The wilds are their home, and every creature is prey.",
    primaryStat: "Dexterity & Wisdom",
    subChoiceLabel: "Favored Enemy",
    subChoiceOptions: ["Undead", "Beasts", "Humanoids", "Fiends", "Dragons"],
    skillHighlights: [
      { level: 1, name: "Favored Enemy", icon: "👁️", desc: "Advantage on checks to track and recall info about a chosen enemy type." },
      { level: 1, name: "Hunter's Mark", icon: "🏹", desc: "Mark a target for +1d6 bonus damage on every hit." },
      { level: 3, name: "Natural Explorer", icon: "🌲", desc: "Advantage in chosen terrain; ignore difficult terrain." },
      { level: 3, name: "Colossus Slayer", icon: "💢", desc: "Deal extra 1d8 damage to a creature below its max HP." },
    ],
  },
  tiefling: {
    type: "race",
    name: "Tiefling",
    icon: "😈",
    desc: "Born of infernal heritage, Tieflings carry the mark of their dark ancestry — horns, a tail, and eyes like burning embers.",
    traits: ["Darkvision", "Hellish Resistance", "Infernal Legacy"],
    skillHighlights: [
      { level: 0, name: "Thaumaturgy", icon: "🗣️", desc: "Amplify your voice, flicker flames, or make the ground tremble." },
      { level: 0, name: "Darkvision", icon: "👁️", desc: "See in complete darkness up to 60 ft." },
      { level: 0, name: "Hellish Rebuke", icon: "🔥", desc: "React: engulf an attacker in hellfire for 2d10 fire damage." },
      { level: 0, name: "Infernal Resistance", icon: "🛡️", desc: "Resist fire and poison damage. Half from both." },
    ],
  },
  dragonborn: {
    type: "race",
    name: "Dragonborn",
    icon: "🐲",
    desc: "Dragon-blooded and proud, Dragonborn stand tall — scales gleaming, draconic ancestry flowing through every vein.",
    traits: ["Draconic Ancestry", "Breath Weapon", "Damage Resistance"],
    subChoiceLabel: "Dragon Ancestry",
    subChoiceOptions: ["Fire", "Cold", "Lightning", "Acid", "Poison", "Thunder"],
    skillHighlights: [
      { level: 0, name: "Draconic Presence", icon: "😤", desc: "Exude an aura of awe or fear to creatures within 10 ft." },
      { level: 0, name: "Damage Resistance", icon: "🛡️", desc: "Resist damage of your ancestry type. Half damage." },
      { level: 0, name: "Breath Weapon", icon: "🔥", desc: "Exhale destructive energy dealing 3d6 damage." },
      { level: 0, name: "Draconic Roar", icon: "😱", desc: "Frighten all enemies within 30 ft." },
    ],
  },
  human: {
    type: "race",
    name: "Human",
    icon: "👤",
    desc: "Ambitious and endlessly adaptable, Humans rise to the top of every civilization — not through destiny, but sheer force of will.",
    traits: ["+1 to All Ability Scores", "Extra Language", "Highly Versatile"],
    skillHighlights: [
      { level: 0, name: "Inspire", icon: "💬", desc: "Grant an ally +1d4 on their next d20 roll." },
      { level: 0, name: "Versatile", icon: "🌟", desc: "+1 bonus to any 3 ability scores of your choice." },
      { level: 0, name: "Rally", icon: "💪", desc: "Regain proficiency bonus HP and gain advantage on next save." },
      { level: 0, name: "Adaptable", icon: "🎯", desc: "Declare advantage on any one ability check or save before rolling." },
    ],
  },
  elf: {
    type: "race",
    name: "Elf",
    icon: "🧝",
    desc: "Ancient and ethereal, Elves drift through the world with grace — their pointed ears alert to sounds no mortal should hear.",
    traits: ["Darkvision", "Keen Senses", "Fey Ancestry", "Trance"],
    skillHighlights: [
      { level: 0, name: "Prestidigitation", icon: "✨", desc: "Minor magic tricks — create a light, clean, chill or warm." },
      { level: 0, name: "Darkvision & Keen Senses", icon: "👁️", desc: "See in darkness 60 ft; advantage on Perception." },
      { level: 0, name: "Fey Step", icon: "🌿", desc: "Teleport up to 30 ft as a bonus action." },
      { level: 0, name: "Elven Accuracy", icon: "🎯", desc: "Reroll one die when you have advantage. Keep the best." },
    ],
  },
  halfling: {
    type: "race",
    name: "Halfling",
    icon: "🦶",
    desc: "Small but stout-hearted, Halflings are blessed with uncanny luck that even fate seems reluctant to defy.",
    traits: ["Lucky", "Brave", "Halfling Nimbleness"],
    skillHighlights: [
      { level: 0, name: "Lucky Charm", icon: "🍀", desc: "Touch an ally to grant +1 on their next d20 roll." },
      { level: 0, name: "Brave", icon: "🦁", desc: "Advantage on saves against being frightened." },
      { level: 0, name: "Second Chance", icon: "🎲", desc: "Force an attacker to reroll their hit." },
      { level: 0, name: "Halfling Nimbleness", icon: "💨", desc: "Move through larger creatures without opportunity attacks." },
    ],
  },
  gnome: {
    type: "race",
    name: "Gnome",
    icon: "🧙",
    desc: "Small, clever, and endlessly curious, Gnomes view the world as a vast puzzle — one they are absolutely going to solve.",
    traits: ["Darkvision", "Gnome Cunning", "Artificer's Lore"],
    skillHighlights: [
      { level: 0, name: "Minor Illusion", icon: "🎭", desc: "Create a sound or small image up to 5 ft. Lasts 1 minute." },
      { level: 0, name: "Gnome Cunning", icon: "🧠", desc: "Advantage on INT, WIS, CHA saves against magic." },
      { level: 0, name: "Blur", icon: "🌀", desc: "Attackers have disadvantage for 1 minute." },
      { level: 0, name: "Illusory Double", icon: "👥", desc: "Summon a decoy; enemies may attack it instead." },
    ],
  },
};

export function getLookupData(term: string): LookupEntry | null {
  return LOOKUP_MAP[term.toLowerCase()] ?? null;
}
