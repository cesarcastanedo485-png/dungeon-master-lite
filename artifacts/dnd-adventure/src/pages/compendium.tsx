import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// All terminology used across the app — extend freely
// ─────────────────────────────────────────────────────────────
interface Term {
  term: string;
  category: string;
  definition: string;
  example?: string;
}

const TERMS: Term[] = [
  // ── Ability Types ────────────────────────────────────────────
  {
    term: "Cantrip",
    category: "Ability Types",
    definition: "A spell or ability usable at will — unlimited times per day with no resource cost. Free action.",
    example: "Mage Hand, Sacred Flame, Minor Illusion.",
  },
  {
    term: "Passive",
    category: "Ability Types",
    definition: "An ability that is always active without any action required. It works automatically in the background.",
    example: "Darkvision, Gnome Cunning, Arcane Scholar.",
  },
  {
    term: "Daily Use",
    category: "Ability Types",
    definition: "An ability usable once per long rest (i.e., once per day). Must be \"spent\" and refills after a full rest.",
    example: "Hellish Rebuke, Blur, Fireball.",
  },
  {
    term: "Situational / Combat",
    category: "Ability Types",
    definition: "An ability usable in specific contexts — usually once per encounter or fight. Resets after combat ends.",
    example: "Action Surge, Sneak Attack trigger, Colossus Slayer.",
  },
  {
    term: "Long Rest",
    category: "Ability Types",
    definition: "8 hours of sleep or meditation. Restores all Daily Use abilities, hit points, and spell slots.",
  },
  {
    term: "Short Rest",
    category: "Ability Types",
    definition: "1 hour of light activity. Restores some abilities (like Second Wind and Action Surge). Does not restore Daily abilities.",
  },

  // ── Core Mechanics ───────────────────────────────────────────
  {
    term: "Advantage",
    category: "Core Mechanics",
    definition: "Roll two d20s and take the higher result. Granted by favorable conditions, spells, or racial traits.",
    example: "Elven Accuracy gives you advantage on attack rolls.",
  },
  {
    term: "Disadvantage",
    category: "Core Mechanics",
    definition: "Roll two d20s and take the lower result. Imposed by difficult conditions or enemy effects.",
    example: "Frightened creatures have disadvantage on attacks.",
  },
  {
    term: "Saving Throw",
    category: "Core Mechanics",
    definition: "A d20 roll + relevant modifier vs. a Difficulty Class (DC) to resist an effect. On success: reduced or no effect.",
    example: "\"Roll a Dexterity saving throw or take 8d6 fire damage from Fireball.\"",
  },
  {
    term: "Difficulty Class (DC)",
    category: "Core Mechanics",
    definition: "The target number your d20 roll must meet or beat to succeed on a saving throw or skill check.",
    example: "DC 15 means you need a total roll of 15 or higher.",
  },
  {
    term: "Proficiency Bonus",
    category: "Core Mechanics",
    definition: "A flat bonus added to rolls for skills, weapons, and saves your character is trained in. Scales with level (+2 at Lv1 up to +6 at Lv17+).",
  },
  {
    term: "Expertise",
    category: "Core Mechanics",
    definition: "Double your proficiency bonus for a chosen skill. Available to Rogues and Bards. Massively boosts reliability.",
    example: "Rogue with Expertise in Stealth + 5 DEX mod = +9 at level 1.",
  },
  {
    term: "Action",
    category: "Core Mechanics",
    definition: "What you do on your turn — attack, cast a spell, dash, hide, help an ally, etc. You get one per turn.",
  },
  {
    term: "Bonus Action",
    category: "Core Mechanics",
    definition: "An additional, faster action on your turn. Usable only when a specific ability calls for it.",
    example: "Cunning Action, Fey Step, Misty Step.",
  },
  {
    term: "Reaction",
    category: "Core Mechanics",
    definition: "An instant response to a trigger, once per round. Used for Shield spell, Counterspell, Hellish Rebuke.",
    example: "Shield spell triggers as a reaction when you are hit.",
  },
  {
    term: "Opportunity Attack",
    category: "Core Mechanics",
    definition: "A free melee attack triggered when an enemy moves out of your reach without disengaging first.",
  },
  {
    term: "Critical Hit",
    category: "Core Mechanics",
    definition: "Rolling a natural 20 on an attack roll. Doubles all damage dice rolled on that hit.",
    example: "Sneak Attack on a crit = 2× the full sneak dice.",
  },
  {
    term: "Initiative",
    category: "Core Mechanics",
    definition: "A d20 + Dexterity modifier roll at the start of combat to determine turn order. Highest acts first.",
  },
  {
    term: "Armor Class (AC)",
    category: "Core Mechanics",
    definition: "The number an attacker must meet or beat to hit you. Determined by armor, shield, and DEX modifier.",
  },

  // ── Ability Scores ───────────────────────────────────────────
  {
    term: "Strength (STR)",
    category: "Ability Scores",
    definition: "Physical power. Governs melee attack and damage rolls, athletics checks, and carrying capacity.",
  },
  {
    term: "Dexterity (DEX)",
    category: "Ability Scores",
    definition: "Agility and reflexes. Governs ranged attacks, stealth, initiative, finesse weapon damage, and AC.",
  },
  {
    term: "Constitution (CON)",
    category: "Ability Scores",
    definition: "Endurance and health. Determines your HP bonus each level and concentration on spells.",
  },
  {
    term: "Intelligence (INT)",
    category: "Ability Scores",
    definition: "Reasoning and memory. Governs wizard spell power, arcana checks, and investigation.",
  },
  {
    term: "Wisdom (WIS)",
    category: "Ability Scores",
    definition: "Perception and intuition. Governs cleric/hunter power, perception checks, and insight.",
  },
  {
    term: "Charisma (CHA)",
    category: "Ability Scores",
    definition: "Force of personality. Governs persuasion, deception, performance, and tiefling/warlock power.",
  },
  {
    term: "Ability Modifier",
    category: "Ability Scores",
    definition: "The bonus or penalty derived from an ability score: (score − 10) ÷ 2, rounded down.",
    example: "STR 16 → modifier +3. DEX 8 → modifier −1.",
  },

  // ── Conditions ───────────────────────────────────────────────
  {
    term: "Frightened",
    category: "Conditions",
    definition: "Disadvantage on all attack rolls and ability checks while the source of fear is visible. Cannot willingly move closer to it.",
    example: "Draconic Roar frightens enemies for 1 round.",
  },
  {
    term: "Prone",
    category: "Conditions",
    definition: "Knocked to the ground. Melee attacks against you have advantage; ranged attacks have disadvantage. Getting up costs half your movement speed.",
    example: "Trip Attack can knock a target prone.",
  },
  {
    term: "Stunned",
    category: "Conditions",
    definition: "Incapacitated, can't move or speak, automatically fails STR/DEX saves, and all attacks against it have advantage.",
    example: "Power Word Stun can stun a creature.",
  },
  {
    term: "Poisoned",
    category: "Conditions",
    definition: "Disadvantage on all attack rolls and ability checks.",
    example: "The Rogue's Poison Blade ability can poison on hit.",
  },
  {
    term: "Incapacitated",
    category: "Conditions",
    definition: "Cannot take actions or reactions. Does not affect movement unless another condition adds that restriction.",
  },
  {
    term: "Concentration",
    category: "Conditions",
    definition: "Some spells require Concentration to maintain. Taking damage requires a Constitution save (DC 10 or half damage, whichever is higher) or the spell ends. Only one concentration spell active at a time.",
    example: "Hunter's Mark, Spirit Guardians, Blur.",
  },

  // ── Damage Types ─────────────────────────────────────────────
  {
    term: "Fire Damage",
    category: "Damage Types",
    definition: "Burns the target. May ignite flammable objects. Resisted by Tieflings (Infernal Resistance) and Dragonborn with fire ancestry.",
    example: "Fireball, Hellish Rebuke, Breath Weapon (fire).",
  },
  {
    term: "Cold Damage",
    category: "Damage Types",
    definition: "Freezes and slows. Resisted by Dragonborn with cold ancestry.",
    example: "Ice Storm, Breath Weapon (cold).",
  },
  {
    term: "Lightning Damage",
    category: "Damage Types",
    definition: "Electric charge. Resisted by Dragonborn with lightning ancestry.",
    example: "Call Lightning, Breath Weapon (lightning).",
  },
  {
    term: "Acid Damage",
    category: "Damage Types",
    definition: "Corrosive substance. May damage objects and armor. Resisted by Dragonborn with acid ancestry.",
  },
  {
    term: "Poison Damage",
    category: "Damage Types",
    definition: "Toxic substance. Often paired with the Poisoned condition. Resisted by Tieflings (Infernal Resistance).",
    example: "Poison Blade, Dragonborn (poison ancestry).",
  },
  {
    term: "Thunder Damage",
    category: "Damage Types",
    definition: "Concussive sonic force. Resisted by Dragonborn with thunder ancestry.",
  },
  {
    term: "Radiant Damage",
    category: "Damage Types",
    definition: "Holy or divine light. Especially effective against undead and fiends.",
    example: "Sacred Flame, Blade Barrier.",
  },
  {
    term: "Force Damage",
    category: "Damage Types",
    definition: "Pure magical energy. Very few creatures resist or are immune to it.",
    example: "Magic Missile, Disintegrate, Wall of Force.",
  },
  {
    term: "Necrotic Damage",
    category: "Damage Types",
    definition: "Death energy that withers living things. Reduces maximum hit points on some effects.",
  },
  {
    term: "Psychic Damage",
    category: "Damage Types",
    definition: "Mind-shattering mental force. Often linked to illusions and mental attacks.",
  },
  {
    term: "Resistance",
    category: "Damage Types",
    definition: "Take half damage from the specified damage type. Passive or granted by racial traits or spells.",
    example: "Tiefling Infernal Resistance: half fire and poison damage.",
  },
  {
    term: "Immunity",
    category: "Damage Types",
    definition: "Take zero damage from the specified type. Rarer than resistance — typically monster-only.",
  },

  // ── Racial Sub-Choices ───────────────────────────────────────
  {
    term: "Dragon Ancestry (Dragonborn)",
    category: "Racial Sub-Choices",
    definition: "Determines your Breath Weapon's damage type and your passive Damage Resistance. Chosen at character creation.",
    example: "Fire ancestry → fire breath + fire resistance. Cold ancestry → cold breath + cold resistance.",
  },
  {
    term: "Divine Domain (Cleric)",
    category: "Racial Sub-Choices",
    definition: "The area of divine power your deity grants you. Shapes your bonus spells and Channel Divinity options.",
    example: "Life (healing), War (attacks), Knowledge (lore), Nature (plants/animals), Trickery (deception).",
  },
  {
    term: "Fighting Style (Fighter)",
    category: "Racial Sub-Choices",
    definition: "A martial specialization chosen at level 1. Dueling (+2 melee damage one-handed), Defense (+1 AC), Archery (+2 ranged attacks).",
  },
  {
    term: "Arcane Tradition (Wizard)",
    category: "Racial Sub-Choices",
    definition: "The school of magic you specialize in. Evocation (offensive spells), Divination (foresight/prediction), Necromancy (life/death magic).",
  },
  {
    term: "Roguish Archetype (Rogue)",
    category: "Racial Sub-Choices",
    definition: "Your criminal specialty. Thief (fast hands, climbing), Assassin (first-strike crits), Arcane Trickster (illusion spells).",
  },
  {
    term: "Favored Enemy (Hunter)",
    category: "Racial Sub-Choices",
    definition: "The type of creature you hunt most effectively. Grants advantage on tracking, recall, and communication with that type.",
    example: "Undead, Beasts, Humanoids, Fiends, Dragons.",
  },

  // ── Game Terms ───────────────────────────────────────────────
  {
    term: "XP (Experience Points)",
    category: "Game Terms",
    definition: "Awarded by the DM for defeating enemies, solving puzzles, and completing quests. Accumulate to level up.",
    example: "Minor encounter: 50–100 XP. Major boss: 300–500 XP.",
  },
  {
    term: "Level",
    category: "Game Terms",
    definition: "Your character's overall power rank, from 1 to 20. Each level grants new abilities, more HP, and a higher proficiency bonus.",
  },
  {
    term: "Hit Points (HP)",
    category: "Game Terms",
    definition: "Your character's life total. Reaching 0 HP means you are unconscious (or dead, at DM discretion). Restored by healing or rests.",
  },
  {
    term: "Temporary Hit Points",
    category: "Game Terms",
    definition: "A buffer of extra HP that absorbs damage before your real HP. Cannot be healed, but refreshes when re-granted.",
    example: "Rally grants temporary HP to an ally.",
  },
  {
    term: "Spell Slot",
    category: "Game Terms",
    definition: "The resource consumed to cast leveled spells. Limited per long rest. Higher-level slots power up spells.",
  },
  {
    term: "Concentration",
    category: "Game Terms",
    definition: "See Conditions → Concentration above.",
  },
  {
    term: "Party",
    category: "Game Terms",
    definition: "The group of up to 4 active adventurers currently in the game. Only party members can take actions with !action.",
  },
  {
    term: "Session",
    category: "Game Terms",
    definition: "A single instance of the adventure from Start to Pause/Reset. Sessions can be saved as campaigns and reloaded.",
  },
  {
    term: "Campaign",
    category: "Game Terms",
    definition: "A saved snapshot of the entire game state — party, narrative, story context, and DM name. Loadable at any time.",
  },

  // ── Commands ─────────────────────────────────────────────────
  {
    term: "!create",
    category: "Commands",
    definition: "Create a new character. Syntax: !create [race] [class] [name] [optional sub-choice]",
    example: "!create dragonborn fighter Drakthar fire  |  !create elf wizard Luna Evocation",
  },
  {
    term: "!action",
    category: "Commands",
    definition: "Declare your character's action in the current scene. The DM will resolve and narrate the result.",
    example: "!action I draw my sword and charge the goblin!",
  },
  {
    term: "!sheet",
    category: "Commands",
    definition: "View your character's full stat sheet in the Characters tab.",
  },
  {
    term: "!party",
    category: "Commands",
    definition: "View the current active party in the Characters tab.",
  },
];

// Group terms by category
const CATEGORIES = [...new Set(TERMS.map(t => t.category))];

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function TermEntry({ term }: { term: Term }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "border-b border-white/5 last:border-b-0 transition-colors",
      open && "bg-white/[0.02]"
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <span className={cn(
          "font-bold font-serif text-base transition-colors",
          open ? "text-primary" : "text-slate-200 group-hover:text-primary/80"
        )}>
          {term.term}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-primary/40 transition-transform duration-200 shrink-0",
          open && "rotate-180 text-primary/70"
        )} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed">{term.definition}</p>
              {term.example && (
                <p className="text-xs text-amber-400/70 italic font-serif">
                  <span className="text-amber-500/60 not-italic font-bold">e.g. </span>{term.example}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Compendium() {
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["Core Mechanics", "Commands"]));

  const filtered = useMemo(() => {
    if (!search.trim()) return TERMS;
    const q = search.toLowerCase();
    return TERMS.filter(t =>
      t.term.toLowerCase().includes(q) ||
      t.definition.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.example ?? "").toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCategories = useMemo(() => {
    const cats = [...new Set(filtered.map(t => t.category))];
    return CATEGORIES.filter(c => cats.includes(c));
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const isSearching = search.trim().length > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-primary text-glow mb-4">Compendium</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          A complete glossary of every term, rule, condition, ability type, and command used in this adventure. 
          Searchable, expandable — your reference tome.
        </p>
        <p className="text-sm text-muted-foreground/60">
          {TERMS.length} entries across {CATEGORIES.length} categories.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value.trim()) setOpenCategories(new Set(CATEGORIES)); }}
          placeholder="Search terms, rules, abilities, commands…"
          className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {isSearching && (
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0 ? "No matching entries." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
        </p>
      )}

      {/* Category accordion sections */}
      <div className="space-y-4">
        {filteredCategories.map((cat, catIdx) => {
          const catTerms = filtered.filter(t => t.category === cat);
          const isOpen = isSearching || openCategories.has(cat);

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.04 }}
              className="glass-panel rounded-xl overflow-hidden border-primary/20"
            >
              {/* Category header */}
              <button
                onClick={() => !isSearching && toggleCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4",
                  !isSearching && "hover:bg-white/[0.03] transition-colors cursor-pointer",
                  isSearching && "cursor-default"
                )}
                disabled={isSearching}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-primary/70" />
                  <h2 className="font-serif font-bold text-lg text-foreground">{cat}</h2>
                  <span className="text-xs text-muted-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    {catTerms.length}
                  </span>
                </div>
                {!isSearching && (
                  <ChevronDown className={cn(
                    "w-5 h-5 text-primary/50 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )} />
                )}
              </button>

              {/* Terms list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="terms"
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="bg-black/20">
                      {catTerms.map(term => (
                        <TermEntry key={term.term} term={term} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
