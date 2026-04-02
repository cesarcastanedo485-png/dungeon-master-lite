import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Skill type badge config
const SKILL_TYPE_CONFIG = {
  cantrip:      { label: "Cantrip",     color: "bg-sky-500/20 text-sky-300 border-sky-500/30",       dot: "bg-sky-400"    },
  passive:      { label: "Passive",     color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  daily:        { label: "Daily Use",   color: "bg-violet-500/20 text-violet-300 border-violet-500/30",   dot: "bg-violet-400"  },
  situational:  { label: "Combat",      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",     dot: "bg-amber-400"   },
} as const;

type SkillType = keyof typeof SKILL_TYPE_CONFIG;

interface Skill {
  icon: string;
  name: string;
  type: SkillType;
  desc: string;
}

interface LevelEntry {
  level: number;
  label?: string;
  choices: Skill[];
}

interface ClassData {
  name: string;
  icon: string;
  color: string;
  glowColor: string;
  desc: string;
  primary: string;
  features: string[];
  flavorQuote: string;
  skillTree: LevelEntry[];
}

const CLASSES_DATA: ClassData[] = [
  {
    name: "Wizard",
    icon: "🔮",
    color: "border-blue-500/30 hover:border-blue-400/50",
    glowColor: "shadow-[0_0_30px_rgba(59,130,246,0.12)]",
    desc: "A scholarly magic-user capable of manipulating the very structures of reality through ancient arcane formulas.",
    primary: "Intelligence",
    features: ["Spellcasting", "Arcane Recovery", "Arcane Tradition"],
    flavorQuote: "\"Magic is not a gift — it is a discipline forged through a lifetime of study.\"",
    skillTree: [
      {
        level: 1,
        choices: [
          { icon: "✋", name: "Mage Hand", type: "cantrip",     desc: "Conjure a spectral hand to manipulate objects up to 30 ft away. Unlimited uses." },
          { icon: "📚", name: "Arcane Scholar",  type: "passive",     desc: "+1 bonus to all Intelligence checks. Permanent." },
        ],
      },
      {
        level: 3,
        choices: [
          { icon: "🔥", name: "Fire Bolt",       type: "cantrip",     desc: "Hurl a bolt of fire dealing 1d10 fire damage. Unlimited, ranged." },
          { icon: "🎯", name: "Magic Missile",   type: "daily",       desc: "Three unerring darts each dealing 1d4+1 force damage. Once per long rest." },
        ],
      },
      {
        level: 5,
        choices: [
          { icon: "🛡️", name: "Shield",          type: "daily",       desc: "Reaction: +5 AC until next turn, blocks Magic Missile. Once per day." },
          { icon: "⚡", name: "Counterspell",    type: "situational", desc: "Interrupt and cancel any spell of 3rd level or lower. Once per encounter." },
        ],
      },
      {
        level: 7,
        choices: [
          { icon: "🔥", name: "Fireball",        type: "daily",       desc: "Detonate a 20-ft explosion dealing 8d6 fire damage to all in range. Once per day." },
          { icon: "🌀", name: "Misty Step",      type: "situational", desc: "Teleport up to 30 ft to a visible location as a bonus action. Once per encounter." },
        ],
      },
      {
        level: 9,
        choices: [
          { icon: "🧱", name: "Wall of Force",   type: "daily",       desc: "Conjure an indestructible wall of force lasting 10 minutes. Once per day." },
          { icon: "🧠", name: "Spell Mastery",   type: "passive",     desc: "Cast one chosen 1st-level spell without expending a slot. Permanent." },
        ],
      },
      {
        level: 11,
        choices: [
          { icon: "💥", name: "Disintegrate",    type: "daily",       desc: "Deal 10d6+40 force damage. On death, target crumbles to dust. Once per day." },
          { icon: "🔆", name: "Arcane Ward",     type: "passive",     desc: "Absorb up to 20 damage before it reaches your HP. Recharges on long rest." },
        ],
      },
      {
        level: 13,
        choices: [
          { icon: "😵", name: "Power Word Stun", type: "daily",       desc: "Stun a creature with ≤150 HP until it saves. Once per day." },
          { icon: "⏱️", name: "Time Stop",       type: "daily",       desc: "Freeze time and take 1d4+1 turns uninterrupted. Once per day." },
        ],
      },
      {
        level: 15,
        choices: [
          { icon: "☄️", name: "Meteor Swarm",    type: "daily",       desc: "Rain four burning meteors, each dealing 20d6 damage in separate 40-ft areas. Once per day." },
          { icon: "🧿", name: "Spell Resistance",type: "passive",     desc: "Advantage on saving throws against all spells and magical effects. Permanent." },
        ],
      },
      {
        level: 17,
        choices: [
          { icon: "✨", name: "Arcane Mastery",  type: "passive",     desc: "Cast spells without material components. Permanent." },
          { icon: "🌟", name: "Wish",            type: "daily",       desc: "The most powerful spell in existence. Duplicate any spell or alter reality. Once per week." },
        ],
      },
      {
        level: 20,
        label: "Archmage Capstone",
        choices: [
          { icon: "♾️", name: "Signature Spell", type: "daily",       desc: "Cast your chosen 3rd-level spell for free, twice per day, with no slot expended." },
        ],
      },
    ],
  },

  {
    name: "Cleric",
    icon: "✨",
    color: "border-yellow-500/30 hover:border-yellow-400/50",
    glowColor: "shadow-[0_0_30px_rgba(234,179,8,0.10)]",
    desc: "A priestly champion who wields divine magic in service of a higher power, healing allies and smiting foes.",
    primary: "Wisdom",
    features: ["Divine Domain", "Channel Divinity", "Turn Undead"],
    flavorQuote: "\"Faith is not the absence of doubt — it is the armor worn despite it.\"",
    skillTree: [
      {
        level: 1,
        choices: [
          { icon: "🔆", name: "Sacred Flame",    type: "cantrip",     desc: "Call divine radiance down on a target for 1d8 radiant damage. Unlimited." },
          { icon: "🙏", name: "Divine Favor",    type: "passive",     desc: "+1 bonus to all saving throws as long as you are conscious. Permanent." },
        ],
      },
      {
        level: 3,
        choices: [
          { icon: "💚", name: "Cure Wounds",     type: "daily",       desc: "Heal a touched creature for 1d8 + WIS modifier HP. Once per long rest." },
          { icon: "☀️", name: "Turn Undead",     type: "situational", desc: "Force undead to flee for 1 minute if they fail a Wisdom save. Once per encounter." },
        ],
      },
      {
        level: 5,
        choices: [
          { icon: "👼", name: "Spirit Guardians",type: "daily",       desc: "Summon holy spirits in a 15-ft aura dealing 3d8 radiant damage to enemies. Once per day." },
          { icon: "🧘", name: "War Caster",      type: "passive",     desc: "Cast spells while wielding shield or weapons. Advantage on concentration. Permanent." },
        ],
      },
      {
        level: 7,
        choices: [
          { icon: "🛡️", name: "Guardian of Faith", type: "daily",    desc: "Summon a spectral guardian that deals 20 damage total before vanishing. Once per day." },
          { icon: "💛", name: "Death Ward",      type: "daily",       desc: "Grant an ally immunity to the next killing blow today. Once per day per target." },
        ],
      },
      {
        level: 9,
        choices: [
          { icon: "💚", name: "Mass Cure Wounds",type: "daily",       desc: "Restore 3d8 + WIS modifier HP to up to six creatures in range. Once per day." },
          { icon: "🌤️", name: "Divine Intervention", type: "daily",  desc: "Call upon your deity for miraculous aid. 20% base chance. Once per day." },
        ],
      },
      {
        level: 11,
        choices: [
          { icon: "⚡", name: "Blade Barrier",   type: "daily",       desc: "Create a wall of spinning blades dealing 6d10 to any who cross it. Once per day." },
          { icon: "🔗", name: "Planar Binding",  type: "situational", desc: "Bind a celestial, fiend, or elemental to your service until it saves. Once per encounter." },
        ],
      },
      {
        level: 13,
        choices: [
          { icon: "🌟", name: "Holy Aura",       type: "daily",       desc: "All allies within 30 ft gain advantage on saves, enemies have disadvantage to hit. Once per day." },
          { icon: "💛", name: "Blessed Healer",  type: "passive",     desc: "When you heal another, you regain 2 + spell level HP yourself. Permanent." },
        ],
      },
      {
        level: 15,
        choices: [
          { icon: "⬆️", name: "Resurrection",   type: "daily",       desc: "Return a dead ally to full life. No material component needed at this tier. Once per day." },
          { icon: "🏥", name: "Supreme Healing", type: "passive",     desc: "When rolling healing dice, always use the maximum possible number. Permanent." },
        ],
      },
      {
        level: 17,
        choices: [
          { icon: "💛", name: "True Resurrection",type: "daily",      desc: "Restore any creature dead up to 200 years, restoring their original body. Once per week." },
          { icon: "🛡️", name: "Aura of Protection", type: "passive", desc: "Add your Wisdom modifier to all ally saving throws within 30 ft. Permanent." },
        ],
      },
      {
        level: 20,
        label: "Divine Avatar Capstone",
        choices: [
          { icon: "☀️", name: "Divine Avatar",   type: "daily",       desc: "Double all healing, gain resistance to all damage, and radiate 60-ft holy light for 1 minute/day." },
        ],
      },
    ],
  },

  {
    name: "Fighter",
    icon: "⚔️",
    color: "border-red-500/30 hover:border-red-400/50",
    glowColor: "shadow-[0_0_30px_rgba(239,68,68,0.10)]",
    desc: "A master of martial combat, skilled with a vast variety of weapons and armor — the unbreakable wall of any party.",
    primary: "Strength or Dexterity",
    features: ["Fighting Style", "Second Wind", "Action Surge"],
    flavorQuote: "\"Every battle is a conversation. I just do all the talking with my blade.\"",
    skillTree: [
      {
        level: 1,
        choices: [
          { icon: "💨", name: "Second Wind",     type: "daily",       desc: "Heal yourself for 1d10 + fighter level as a bonus action. Once per short rest." },
          { icon: "🛡️", name: "Fighting Style",  type: "passive",     desc: "Choose: Dueling (+2 damage), Defense (+1 AC), or Archery (+2 to ranged attacks). Permanent." },
        ],
      },
      {
        level: 3,
        choices: [
          { icon: "⚡", name: "Action Surge",    type: "situational", desc: "Take one additional full action on your turn. Once per short rest." },
          { icon: "🎯", name: "Trip Attack",     type: "situational", desc: "Expend a superiority die (d8) to knock a target prone on a hit. Once per encounter." },
        ],
      },
      {
        level: 5,
        choices: [
          { icon: "⚔️", name: "Extra Attack",    type: "passive",     desc: "Attack twice instead of once when using the Attack action. Permanent." },
          { icon: "🔄", name: "Riposte",         type: "situational", desc: "When a creature misses you in melee, use your reaction to attack back. Once per encounter." },
        ],
      },
      {
        level: 7,
        choices: [
          { icon: "🧠", name: "War Magic",       type: "situational", desc: "After casting a bonus-action spell, make one weapon attack as a bonus action too. Once per turn." },
          { icon: "🔮", name: "Precision Attack", type: "situational", desc: "Add a d8 to your attack roll after seeing the result. Once per encounter." },
        ],
      },
      {
        level: 9,
        choices: [
          { icon: "🔁", name: "Indomitable",     type: "daily",       desc: "Reroll a failed saving throw. You must use the new roll. Once per long rest." },
          { icon: "⚡", name: "Action Surge II",  type: "situational", desc: "Use Action Surge twice per short rest. Devastating in boss fights." },
        ],
      },
      {
        level: 11,
        choices: [
          { icon: "⚔️", name: "Extra Attack III",type: "passive",     desc: "Attack three times when you take the Attack action. Permanent." },
          { icon: "💪", name: "Rally",           type: "situational", desc: "Inspire an ally to gain 1d6 + CHA temporary HP. Once per encounter." },
        ],
      },
      {
        level: 13,
        choices: [
          { icon: "🎲", name: "Superiority d10", type: "passive",     desc: "Your superiority dice improve from d8 to d10. Permanent." },
          { icon: "🌊", name: "Sweeping Attack", type: "situational", desc: "Deal surplus damage from one hit to an adjacent enemy. Once per encounter." },
        ],
      },
      {
        level: 15,
        choices: [
          { icon: "♾️", name: "Relentless",      type: "passive",     desc: "Regain one superiority die at the start of combat if you have none. Permanent." },
          { icon: "🎲", name: "Superiority d12", type: "passive",     desc: "Your superiority dice improve from d10 to d12. Permanent." },
        ],
      },
      {
        level: 17,
        choices: [
          { icon: "❤️‍🔥", name: "Survivor",      type: "passive",     desc: "Regain HP equal to 5 + CON modifier at the start of each turn when below half HP. Permanent." },
          { icon: "⚡", name: "Action Surge III", type: "situational", desc: "Use Action Surge three times per short rest. Unrelenting force." },
        ],
      },
      {
        level: 20,
        label: "Champion Capstone",
        choices: [
          { icon: "⚔️", name: "Extra Attack IV", type: "passive",     desc: "Attack four times with a single Attack action. The pinnacle of martial mastery. Permanent." },
        ],
      },
    ],
  },

  {
    name: "Rogue",
    icon: "🗡️",
    color: "border-slate-500/30 hover:border-slate-400/50",
    glowColor: "shadow-[0_0_30px_rgba(100,116,139,0.12)]",
    desc: "A scoundrel who uses stealth and trickery to overcome obstacles. Where others fight fair, the Rogue wins.",
    primary: "Dexterity",
    features: ["Sneak Attack", "Cunning Action", "Uncanny Dodge"],
    flavorQuote: "\"I don't cheat. I just understand the rules better than anyone else.\"",
    skillTree: [
      {
        level: 1,
        choices: [
          { icon: "🗡️", name: "Sneak Attack 1d6",type: "passive",     desc: "Deal +1d6 bonus damage when you have advantage or an ally is adjacent to target. Permanent." },
          { icon: "🎓", name: "Expertise",       type: "passive",     desc: "Double your proficiency bonus in two chosen skills. Permanent." },
        ],
      },
      {
        level: 3,
        choices: [
          { icon: "💨", name: "Cunning Action",  type: "situational", desc: "Dash, Disengage, or Hide as a bonus action on every turn. Once per turn." },
          { icon: "🎭", name: "Thief Archetype", type: "passive",     desc: "Fast Hands (use objects as bonus action), Second-Story Work (climb full speed). Permanent." },
        ],
      },
      {
        level: 5,
        choices: [
          { icon: "🛡️", name: "Uncanny Dodge",  type: "situational", desc: "Use your reaction to halve attack damage from a visible attacker. Once per round." },
          { icon: "☠️", name: "Poison Blade",    type: "situational", desc: "Coat your weapon for +2d6 poison damage on next hit. Once per encounter." },
        ],
      },
      {
        level: 7,
        choices: [
          { icon: "🌪️", name: "Evasion",        type: "passive",     desc: "No damage on successful Dex saves; half damage on failures. Permanent." },
          { icon: "💀", name: "Ambush",          type: "situational", desc: "Auto-crit on the first round against an unaware target. Once per encounter." },
        ],
      },
      {
        level: 9,
        choices: [
          { icon: "🗡️", name: "Sneak Attack 5d6",type: "passive",    desc: "Bonus sneak attack damage grows to 5d6. Permanent." },
          { icon: "🃏", name: "Slippery Mind",   type: "passive",     desc: "Gain proficiency in Wisdom saving throws. Permanent." },
        ],
      },
      {
        level: 11,
        choices: [
          { icon: "🎯", name: "Reliable Talent", type: "passive",     desc: "Any d20 roll of 9 or lower for a proficient skill is treated as a 10. Permanent." },
          { icon: "🖐️", name: "Fast Hands+",    type: "situational", desc: "Use Thieves' Tools, activate items, or pickpocket as a bonus action. Once per turn." },
        ],
      },
      {
        level: 13,
        choices: [
          { icon: "👁️", name: "Blindsense",     type: "passive",     desc: "Detect invisible creatures within 10 ft even without sight. Permanent." },
          { icon: "🕶️", name: "Shadow Step",    type: "situational", desc: "Teleport from one shadow to another within 60 ft. Once per encounter." },
        ],
      },
      {
        level: 15,
        choices: [
          { icon: "🌫️", name: "Elusive",        type: "passive",     desc: "No attack ever has advantage against you as long as you aren't incapacitated. Permanent." },
          { icon: "⚰️", name: "Death Strike",   type: "daily",       desc: "On surprise attack, target must save or take double damage. Once per day." },
        ],
      },
      {
        level: 17,
        choices: [
          { icon: "🗡️", name: "Sneak Attack 9d6",type: "passive",    desc: "Bonus sneak attack damage grows to 9d6. Permanent." },
          { icon: "🍀", name: "Stroke of Luck",  type: "daily",       desc: "Turn a miss into a hit, or a failed ability check into a success. Once per day." },
        ],
      },
      {
        level: 20,
        label: "Grandmaster Thief Capstone",
        choices: [
          { icon: "🏆", name: "Sneak Attack 10d6", type: "passive",   desc: "Maximum sneak attack bonus. You are the most lethal assassin in the realm. Permanent." },
          { icon: "🎩", name: "Legendary Heist",  type: "daily",      desc: "Auto-succeed on any one non-combat skill or tool check per day." },
        ],
      },
    ],
  },

  {
    name: "Hunter",
    icon: "🏹",
    color: "border-green-500/30 hover:border-green-400/50",
    glowColor: "shadow-[0_0_30px_rgba(34,197,94,0.10)]",
    desc: "A warrior who combines martial prowess and nature magic. The wilds are their home, and every creature is prey.",
    primary: "Dexterity & Wisdom",
    features: ["Favored Enemy", "Natural Explorer", "Ranger Archetype"],
    flavorQuote: "\"The hunt is never truly over. The prey simply hasn't realized it yet.\"",
    skillTree: [
      {
        level: 1,
        choices: [
          { icon: "👁️", name: "Favored Enemy",  type: "passive",     desc: "Advantage on checks to track, recall info, and communicate with a chosen enemy type. Permanent." },
          { icon: "🏹", name: "Hunter's Mark",   type: "daily",       desc: "Mark a target for +1d6 bonus damage on every hit. Lasts 1 hour. Once per long rest." },
        ],
      },
      {
        level: 3,
        choices: [
          { icon: "🌲", name: "Natural Explorer",type: "passive",     desc: "Advantage in chosen terrain; ignore difficult terrain; travel at full speed while tracking. Permanent." },
          { icon: "💢", name: "Colossus Slayer", type: "situational", desc: "Deal an extra 1d8 damage to a creature already below its maximum HP. Once per turn." },
        ],
      },
      {
        level: 5,
        choices: [
          { icon: "⚔️", name: "Extra Attack",    type: "passive",     desc: "Attack twice instead of once when using the Attack action. Permanent." },
          { icon: "🛡️", name: "Multiattack Defense", type: "situational", desc: "+4 AC after the first hit from the same creature in a turn. Once per round." },
        ],
      },
      {
        level: 7,
        choices: [
          { icon: "🌍", name: "Primeval Awareness", type: "daily",   desc: "Detect the presence of enemy types within 6 miles. Once per day." },
          { icon: "💪", name: "Steel Will",      type: "daily",       desc: "Advantage on saving throws against fear. Once per day." },
        ],
      },
      {
        level: 9,
        choices: [
          { icon: "🌊", name: "Volley",          type: "situational", desc: "Rain arrows into a 10-ft radius, hitting every creature in the area. Once per encounter." },
          { icon: "👁️", name: "Greater Favored Enemy", type: "passive", desc: "Gain a second favored enemy type with all associated benefits. Permanent." },
        ],
      },
      {
        level: 11,
        choices: [
          { icon: "🌿", name: "Hide in Plain Sight", type: "passive", desc: "+10 to Stealth when camouflaged in natural terrain. Permanent." },
          { icon: "🌪️", name: "Evasion",         type: "passive",    desc: "No damage on successful Dex saves; half damage on failures. Permanent." },
        ],
      },
      {
        level: 13,
        choices: [
          { icon: "💨", name: "Vanish",          type: "situational", desc: "Hide as a bonus action; can't be tracked by non-magical means. Once per turn." },
          { icon: "🏃", name: "Fleet of Foot",   type: "passive",     desc: "Dash as a bonus action on any turn. Permanent." },
        ],
      },
      {
        level: 15,
        choices: [
          { icon: "👁️", name: "Feral Senses",   type: "passive",     desc: "No disadvantage vs invisible/unseen foes; 30-ft supernatural awareness. Permanent." },
          { icon: "🌀", name: "Whirlwind Attack",type: "situational", desc: "Attack every creature within melee reach in one sweeping action. Once per encounter." },
        ],
      },
      {
        level: 17,
        choices: [
          { icon: "🔄", name: "Stand Against the Tide", type: "situational", desc: "When an enemy misses you in melee, redirect their attack to another creature. Once per round." },
          { icon: "⚡", name: "Ambuscade",       type: "passive",     desc: "Always act in the surprise round and take a full turn regardless of surprise status. Permanent." },
        ],
      },
      {
        level: 20,
        label: "Apex Predator Capstone",
        choices: [
          { icon: "🐺", name: "Foe Slayer",      type: "passive",     desc: "Once per turn, add your Wisdom modifier to either the attack roll or damage roll against a target. Permanent." },
        ],
      },
    ],
  },
];

// Skill badge
function SkillBadge({ type }: { type: SkillType }) {
  const cfg = SKILL_TYPE_CONFIG[type];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
      cfg.color
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// Single level entry
function LevelBlock({ entry, isLast }: { entry: LevelEntry; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {entry.level}
        </div>
        {!isLast && <div className="w-px flex-1 bg-primary/15 my-1" />}
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        {entry.label && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 mb-2">{entry.label}</p>
        )}
        <div className="space-y-2">
          {entry.choices.map((skill) => (
            <div
              key={skill.name}
              className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
            >
              <span className="text-lg leading-none mt-0.5 shrink-0">{skill.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="font-bold text-slate-200 text-sm">{skill.name}</span>
                  <SkillBadge type={skill.type} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{skill.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Expandable class card
function ClassCard({ cls, index }: { cls: ClassData; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        "glass-panel rounded-xl overflow-hidden border-primary/20 transition-all duration-300",
        cls.color,
        isExpanded && cls.glowColor
      )}
    >
      {/* Card header — always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex flex-col sm:flex-row cursor-pointer group"
        aria-expanded={isExpanded}
      >
        {/* Icon side */}
        <div className="sm:w-28 bg-black/40 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5 shrink-0">
          <div className={cn(
            "w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mb-3 border border-primary/30 transition-all duration-300",
            isExpanded && "bg-primary/20 border-primary/60 scale-105"
          )}>
            {cls.icon}
          </div>
          <h2 className="font-serif text-lg font-bold text-foreground text-center">{cls.name}</h2>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary text-center">{cls.primary}</div>
        </div>

        {/* Description side */}
        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm">{cls.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {cls.features.map(f => (
                <span key={f} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-200">{f}</span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] text-primary/60 font-bold uppercase tracking-wider">
              {isExpanded ? "Collapse skill tree" : "View skill tree Lv 1–20"}
            </p>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-primary/60 transition-transform duration-300 shrink-0",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      {/* Expandable skill tree */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="tree"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 bg-black/40 px-5 pt-5 pb-2">
              {/* Flavor quote */}
              <p className="font-serif italic text-primary/70 text-sm text-center mb-5 pb-4 border-b border-white/5">
                {cls.flavorQuote}
              </p>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-5">
                {(Object.keys(SKILL_TYPE_CONFIG) as SkillType[]).map(t => (
                  <SkillBadge key={t} type={t} />
                ))}
              </div>

              {/* Skill tree timeline */}
              <div>
                {cls.skillTree.map((entry, i) => (
                  <LevelBlock
                    key={entry.level}
                    entry={entry}
                    isLast={i === cls.skillTree.length - 1}
                  />
                ))}
              </div>

              {/* Back link */}
              <button
                onClick={() => setIsExpanded(false)}
                className="mt-2 mb-4 w-full text-center text-xs text-primary/50 hover:text-primary transition-colors py-2"
              >
                ↑ Collapse — Back to Classes Overview
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Classes() {
  return (
    <div className="space-y-8 pb-12">
      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-primary text-glow mb-4">Classes & Vocations</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          Class is the primary definition of what your character can do in this realm.
          It shapes how you think, how you fight, and what destiny awaits you.
        </p>
        <p className="text-sm text-muted-foreground/60">
          Click any class card to expand its full skill tree — levels 1 through 20.
        </p>
      </div>

      {/* Skill type legend — always visible */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Skill types:</span>
        {(Object.keys(SKILL_TYPE_CONFIG) as SkillType[]).map(t => (
          <SkillBadge key={t} type={t} />
        ))}
      </div>

      <div className="space-y-5">
        {CLASSES_DATA.map((cls, idx) => (
          <ClassCard key={cls.name} cls={cls} index={idx} />
        ))}
      </div>
    </div>
  );
}
