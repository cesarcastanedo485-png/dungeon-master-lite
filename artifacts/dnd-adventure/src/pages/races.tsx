import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Reuse same skill-type badge system as Classes tab
const ABILITY_TYPE_CONFIG = {
  cantrip:     { label: "Cantrip",    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",           dot: "bg-sky-400"     },
  passive:     { label: "Passive",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  daily:       { label: "Daily Use",  color: "bg-violet-500/20 text-violet-300 border-violet-500/30",   dot: "bg-violet-400"  },
  situational: { label: "Combat",     color: "bg-amber-500/20 text-amber-300 border-amber-500/30",       dot: "bg-amber-400"   },
} as const;

type AbilityType = keyof typeof ABILITY_TYPE_CONFIG;

interface RacialAbility {
  icon: string;
  name: string;
  type: AbilityType;
  desc: string;
}

interface RaceData {
  name: string;
  icon: string;
  accent: string;
  glow: string;
  desc: string;
  traits: string[];
  flavorQuote: string;
  abilities: RacialAbility[];
}

const RACES_DATA: RaceData[] = [
  {
    name: "Tiefling",
    icon: "😈",
    accent: "border-red-500/30 hover:border-red-400/50",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.12)]",
    desc: "Born of infernal heritage, Tieflings carry the mark of their dark ancestry — horns, a tail, and eyes like burning embers.",
    traits: ["Darkvision", "Hellish Resistance", "Infernal Legacy"],
    flavorQuote: "\"Hell is not where we come from. Hell is what others make of our presence.\"",
    abilities: [
      { icon: "🗣️", name: "Thaumaturgy",       type: "cantrip",     desc: "Amplify your voice, flicker nearby flames, or make the ground tremble. Unlimited, at-will." },
      { icon: "👁️", name: "Darkvision",         type: "passive",     desc: "See in complete darkness up to 60 ft as dim light. Permanent." },
      { icon: "🔥", name: "Hellish Rebuke",     type: "daily",       desc: "When hit by an attack, react: engulf the attacker in hellfire for 2d10 fire damage. Once per long rest." },
      { icon: "🛡️", name: "Infernal Resistance",type: "situational", desc: "Resist fire and poison damage in any encounter. You take half from both. Once per encounter." },
    ],
  },
  {
    name: "Dragonborn",
    icon: "🐲",
    accent: "border-orange-500/30 hover:border-orange-400/50",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.12)]",
    desc: "Dragon-blooded and proud, Dragonborn stand tall in humanoid form — scales gleaming, draconic ancestry flowing through every vein.",
    traits: ["Draconic Ancestry", "Breath Weapon", "Damage Resistance"],
    flavorQuote: "\"We do not breathe fire because we are angry. We breathe fire because we are dragonborn.\"",
    abilities: [
      { icon: "😤", name: "Draconic Presence",  type: "cantrip",     desc: "Exude an aura of awe or fear to all creatures within 10 ft. Unlimited, at-will." },
      { icon: "🛡️", name: "Damage Resistance",  type: "passive",     desc: "Resist the damage type of your ancestry (fire, cold, lightning, acid, etc.). Half damage, permanent." },
      { icon: "🔥", name: "Breath Weapon",       type: "daily",       desc: "Exhale a line or cone of destructive energy dealing 3d6 damage. Once per short rest." },
      { icon: "😱", name: "Draconic Roar",       type: "situational", desc: "Roar to frighten all enemies within 30 ft — they must save or be frightened 1 round. Once per encounter." },
    ],
  },
  {
    name: "Human",
    icon: "👤",
    accent: "border-yellow-500/30 hover:border-yellow-400/50",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.10)]",
    desc: "Ambitious and endlessly adaptable, Humans rise to the top of every civilization — not through destiny, but sheer force of will.",
    traits: ["+1 to All Ability Scores", "Extra Language", "Highly Versatile"],
    flavorQuote: "\"We live short lives and pack them full of impossible things.\"",
    abilities: [
      { icon: "💬", name: "Inspire",             type: "cantrip",     desc: "Grant an ally +1d4 on their next d20 roll with a word of encouragement. Unlimited, at-will." },
      { icon: "🌟", name: "Versatile",           type: "passive",     desc: "+1 bonus to any 3 ability scores of your choice at character creation. Permanent." },
      { icon: "💪", name: "Rally",               type: "daily",       desc: "Push through exhaustion — regain proficiency bonus HP and gain advantage on next saving throw. Once per long rest." },
      { icon: "🎯", name: "Adaptable",           type: "situational", desc: "Declare advantage on any one ability check or saving throw before rolling. Once per encounter." },
    ],
  },
  {
    name: "Elf",
    icon: "🧝",
    accent: "border-emerald-500/30 hover:border-emerald-400/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.10)]",
    desc: "Ancient and ethereal, Elves drift through the world with grace — their pointed ears alert to sounds no mortal should hear.",
    traits: ["Darkvision", "Keen Senses", "Fey Ancestry", "Trance"],
    flavorQuote: "\"We do not sleep. We remember. And our memories are older than your kingdoms.\"",
    abilities: [
      { icon: "✨", name: "Prestidigitation",    type: "cantrip",     desc: "Minor magic tricks — create a light, clean an object, chill or warm food, or leave a small mark. Unlimited." },
      { icon: "👁️", name: "Darkvision & Keen Senses", type: "passive", desc: "See in darkness 60 ft; advantage on all Perception checks. Permanent." },
      { icon: "🌿", name: "Fey Step",           type: "daily",       desc: "Teleport up to 30 ft to an unoccupied space you can see as a bonus action. Once per long rest." },
      { icon: "🎯", name: "Elven Accuracy",     type: "situational", desc: "When you roll advantage on an attack or ability check, reroll one of the dice and keep the best. Once per encounter." },
    ],
  },
  {
    name: "Halfling",
    icon: "🦶",
    accent: "border-amber-500/30 hover:border-amber-400/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.10)]",
    desc: "Small but stout-hearted, Halflings are blessed with uncanny luck that even fate seems reluctant to defy.",
    traits: ["Lucky", "Brave", "Halfling Nimbleness"],
    flavorQuote: "\"A bad situation is just a good story waiting to be told over a second breakfast.\"",
    abilities: [
      { icon: "🍀", name: "Lucky Charm",        type: "cantrip",     desc: "Touch an ally to grant them +1 on their next d20 roll. Unlimited, at-will (different ally each time)." },
      { icon: "🦁", name: "Brave",              type: "passive",     desc: "Advantage on saving throws against the frightened condition. Permanent — fear rarely takes you." },
      { icon: "🎲", name: "Second Chance",      type: "daily",       desc: "When a creature hits you, force them to reroll — you choose which result they use. Once per long rest." },
      { icon: "💨", name: "Halfling Nimbleness",type: "situational", desc: "Move through the space of any creature larger than you without provoking opportunity attacks. Once per encounter." },
    ],
  },
  {
    name: "Gnome",
    icon: "🧙",
    accent: "border-blue-500/30 hover:border-blue-400/50",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.10)]",
    desc: "Small, clever, and endlessly curious, Gnomes view the world as a vast puzzle — one they are absolutely going to solve.",
    traits: ["Darkvision", "Gnome Cunning", "Artificer's Lore"],
    flavorQuote: "\"The difference between a trap and a mechanism is entirely who built it.\"",
    abilities: [
      { icon: "🎭", name: "Minor Illusion",     type: "cantrip",     desc: "Create a sound or small image of an object up to 5 ft. Lasts 1 minute. Unlimited, at-will." },
      { icon: "🧠", name: "Gnome Cunning",      type: "passive",     desc: "Advantage on all Intelligence, Wisdom, and Charisma saving throws against magic. Permanent." },
      { icon: "🌀", name: "Blur",               type: "daily",       desc: "Your body blurs — attackers have disadvantage on all attacks against you for 1 minute. Once per long rest." },
      { icon: "👥", name: "Illusory Double",    type: "situational", desc: "Summon a perfect decoy of yourself as a bonus action — enemies may attack it instead of you. Once per encounter." },
    ],
  },
];

function AbilityBadge({ type }: { type: AbilityType }) {
  const cfg = ABILITY_TYPE_CONFIG[type];
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

function RaceCard({ race, index }: { race: RaceData; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        "glass-panel rounded-xl overflow-hidden border-primary/20 transition-all duration-300",
        race.accent,
        isExpanded && race.glow
      )}
    >
      {/* Card header — clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 group"
        aria-expanded={isExpanded}
      >
        {/* Icon row */}
        <div className="flex items-center gap-4 mb-3">
          <div className={cn(
            "w-14 h-14 bg-black/50 rounded-full flex items-center justify-center text-3xl border border-white/10 transition-all duration-300 shrink-0",
            isExpanded ? "scale-110 border-white/20 bg-black/70" : "group-hover:scale-105"
          )}>
            {race.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-foreground">{race.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{race.desc}</p>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-primary/50 transition-transform duration-300 shrink-0",
            isExpanded && "rotate-180"
          )} />
        </div>

        {/* Traits row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {race.traits.map(t => (
            <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[11px] text-slate-300">{t}</span>
          ))}
        </div>

        {/* Expand hint */}
        <p className="text-[11px] text-primary/50 font-bold uppercase tracking-wider text-left">
          {isExpanded ? "Hide racial abilities" : "View racial abilities"}
        </p>
      </button>

      {/* Expandable racial abilities */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="abilities"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-white/5 bg-black/30 space-y-2">
              {/* Flavor quote */}
              <p className="font-serif italic text-primary/60 text-xs text-center py-3 border-b border-white/5 mb-3">
                {race.flavorQuote}
              </p>

              {race.abilities.map(ability => (
                <div
                  key={ability.name}
                  className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 hover:border-white/10 transition-colors"
                >
                  <span className="text-lg leading-none mt-0.5 shrink-0">{ability.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-200 text-sm">{ability.name}</span>
                      <AbilityBadge type={ability.type} />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{ability.desc}</p>
                  </div>
                </div>
              ))}

              {/* Collapse link */}
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full text-center text-xs text-primary/40 hover:text-primary transition-colors py-1.5 mt-1"
              >
                ↑ Collapse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Races() {
  return (
    <div className="space-y-8 pb-12">
      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-primary text-glow mb-4">Races of the Realm</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          Every bloodline carries its own ancient power. Choose your heritage and claim the abilities
          that have shaped your people since the world was young.
        </p>
        <p className="text-sm text-muted-foreground/60">
          Click any race card to reveal its racial abilities.
        </p>
      </div>

      {/* Ability type legend */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Ability types:</span>
        {(Object.keys(ABILITY_TYPE_CONFIG) as AbilityType[]).map(t => (
          <AbilityBadge key={t} type={t} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {RACES_DATA.map((race, idx) => (
          <RaceCard key={race.name} race={race} index={idx} />
        ))}
      </div>
    </div>
  );
}
