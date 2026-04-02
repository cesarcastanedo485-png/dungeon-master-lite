import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, UserPlus, X, Swords, ChevronDown, Package, Zap, Star } from "lucide-react";
import {
  useListCharacters,
  useCreateCharacter,
  useActivateCharacter,
  useDeactivateCharacter,
  useDeleteCharacter,
  getListCharactersQueryKey,
  type Character
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const RACES = ["tiefling", "dragonborn", "human", "elf", "halfling", "gnome"];
const CLASSES = ["wizard", "cleric", "fighter", "rogue", "hunter"];

// Sub-choice options that appear conditionally based on race/class selection
const SUB_CHOICE_OPTIONS: Record<string, string[]> = {
  dragonborn: ["fire", "cold", "lightning", "acid", "poison", "thunder"],
  cleric:     ["Life", "War", "Knowledge", "Nature", "Trickery"],
  fighter:    ["Dueling", "Defense", "Archery"],
  wizard:     ["Evocation", "Divination", "Necromancy"],
  rogue:      ["Thief", "Assassin", "Arcane Trickster"],
  hunter:     ["Undead", "Beasts", "Humanoids", "Fiends", "Dragons"],
};

const SUB_CHOICE_LABELS: Record<string, string> = {
  dragonborn: "Dragon Ancestry",
  cleric:     "Divine Domain",
  fighter:    "Fighting Style",
  wizard:     "Arcane Tradition",
  rogue:      "Roguish Archetype",
  hunter:     "Favored Enemy",
};

function getSubChoiceKey(race: string, charClass: string): string | null {
  if (SUB_CHOICE_OPTIONS[race]) return race;
  if (SUB_CHOICE_OPTIONS[charClass]) return charClass;
  return null;
}

// XP thresholds per level (1-20)
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 999999];

function getXpProgress(xp: number, level: number): { current: number; needed: number; pct: number } {
  const currentLevelXp = XP_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = XP_THRESHOLDS[level] ?? 999999;
  const needed = nextLevelXp - currentLevelXp;
  const current = xp - currentLevelXp;
  const pct = level >= 20 ? 100 : Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, pct };
}

// Stat modifier formula
function statMod(value: number) {
  const mod = Math.floor((value - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// A single stat cell
function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs font-bold text-primary">{statMod(value)}</div>
    </div>
  );
}

// HP bar
function HPBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
      <div
        className={cn(
          "h-full transition-all duration-700 rounded-full",
          pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-destructive"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Race/class icons for flavor
const RACE_ICONS: Record<string, string> = {
  tiefling: "😈", dragonborn: "🐲", human: "👤", elf: "🧝", halfling: "🦶", gnome: "🧙",
};
const CLASS_ICONS: Record<string, string> = {
  wizard: "🔮", cleric: "✨", fighter: "⚔️", rogue: "🗡️", hunter: "🏹",
};

// Expandable character card component
function CharacterCard({ char, isActive, activePartyCount }: { char: Character; isActive: boolean; activePartyCount: number }) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const { mutate: activateChar } = useActivateCharacter({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() }) }
  });
  const { mutate: deactivateChar } = useDeactivateCharacter({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() }) }
  });
  const { mutate: deleteChar } = useDeleteCharacter({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() }) }
  });

  // Arrays are already parsed by the API
  const inventory: string[] = char.inventory ?? [];
  const skills: string[] = char.skills ?? [];

  const xpInfo = getXpProgress(char.xp, char.level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "glass-panel rounded-xl overflow-hidden border border-primary/20 transition-all duration-300 relative",
        isExpanded && "border-primary/40 shadow-[0_0_20px_rgba(212,175,55,0.08)]"
      )}
    >
      {/* Watermark shield */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none">
        <Shield className="w-24 h-24" />
      </div>

      {/* Clickable header area */}
      <button
        onClick={() => setIsExpanded(v => !v)}
        className="w-full text-left p-5 relative z-10 group"
        aria-expanded={isExpanded}
      >
        {/* Name / level row */}
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="font-serif text-2xl font-bold text-primary">{char.name}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {RACE_ICONS[char.race] ?? "•"} {char.race} &nbsp;{CLASS_ICONS[char.class] ?? "•"} {char.class}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">Lvl {char.level}</div>
              <div className="text-xs text-muted-foreground">{char.username}</div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-primary/40 transition-transform duration-300 mt-1",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>

        {/* HP + XP quick view */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-black/40 rounded-lg p-2 border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase">HP</span>
            <div className="font-bold text-red-400">{char.hp} <span className="text-xs text-red-400/40">/ {char.maxHp}</span></div>
            <HPBar hp={char.hp} maxHp={char.maxHp} />
          </div>
          <div className="bg-black/40 rounded-lg p-2 border border-white/5">
            <span className="text-[10px] text-muted-foreground uppercase">XP</span>
            <div className="font-bold text-blue-400">{char.xp.toLocaleString()}</div>
            {char.level < 20 ? (
              <p className="text-[10px] text-muted-foreground mt-0.5">{xpInfo.pct}% to Lv {char.level + 1}</p>
            ) : (
              <p className="text-[10px] text-amber-400 mt-0.5">Max Level 🏆</p>
            )}
          </div>
        </div>

        {/* Expand hint */}
        <p className="text-[10px] text-primary/40 uppercase tracking-wider mt-3 font-bold">
          {isExpanded ? "▲ Collapse character sheet" : "▼ View full character sheet"}
        </p>
      </button>

      {/* Expanded character sheet */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="sheet"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 bg-black/30 px-5 pt-4 pb-2 space-y-4 relative z-10">

              {/* XP Progress bar */}
              {char.level < 20 && (
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    <span>XP to Level {char.level + 1}</span>
                    <span>{xpInfo.current.toLocaleString()} / {xpInfo.needed.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${xpInfo.pct}%` }} />
                  </div>
                </div>
              )}

              {/* Sub-choice badge */}
              {char.subChoice && (() => {
                const subKey = getSubChoiceKey(char.race, char.class);
                const label = subKey ? (SUB_CHOICE_LABELS[subKey] ?? "Specialization") : "Specialization";
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">{label}: </span>
                      <span className="text-sm font-bold text-amber-300 capitalize">{char.subChoice}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Stats grid */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Ability Scores
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  <StatCell label="STR" value={char.strength} />
                  <StatCell label="DEX" value={char.dexterity} />
                  <StatCell label="CON" value={char.constitution} />
                  <StatCell label="INT" value={char.intelligence} />
                  <StatCell label="WIS" value={char.wisdom} />
                  <StatCell label="CHA" value={char.charisma} />
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Unlocked Skills
                </p>
                {skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-black/30 border border-white/5 rounded-lg px-3 py-2">
                    No skills unlocked yet — level up in-game to unlock class abilities.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-md text-xs font-bold text-primary">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Inventory
                </p>
                {inventory.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-black/30 border border-white/5 rounded-lg px-3 py-2">
                    Empty pack — loot items in-game to fill your inventory.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {inventory.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-primary/60">◆</span>{item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Collapse link inside expanded sheet */}
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full text-center text-[10px] text-primary/30 hover:text-primary transition-colors py-1"
              >
                ↑ Collapse sheet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="p-4 pt-0 flex gap-2 relative z-10">
        {isActive ? (
          <button
            onClick={() => deactivateChar({ id: char.id })}
            className="flex-1 py-2 bg-black/40 border border-white/10 hover:border-destructive hover:text-destructive rounded-lg text-sm font-bold transition-colors"
          >
            Remove from Party
          </button>
        ) : (
          <button
            onClick={() => activateChar({ id: char.id })}
            disabled={activePartyCount >= 4}
            className="flex-1 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Party
          </button>
        )}
        <button
          onClick={() => { if (confirm("Permanently delete character?")) deleteChar({ id: char.id }); }}
          className="px-3 py-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function Characters() {
  const { username } = useUser();
  const queryClient = useQueryClient();
  const { data: characters = [], isLoading } = useListCharacters();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const DEFAULT_RACE = RACES[0] ?? "tiefling";
  const DEFAULT_CLASS = CLASSES[0] ?? "wizard";
  const DEFAULT_SUB = SUB_CHOICE_OPTIONS[DEFAULT_RACE]?.[0] ?? SUB_CHOICE_OPTIONS[DEFAULT_CLASS]?.[0] ?? "";
  const [newChar, setNewChar] = useState({ name: "", race: DEFAULT_RACE, class: DEFAULT_CLASS, subChoice: DEFAULT_SUB });

  const { mutate: createChar, isPending: isCreating } = useCreateCharacter({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
        setIsCreateOpen(false);
        const defSub = SUB_CHOICE_OPTIONS[DEFAULT_RACE]?.[0] ?? SUB_CHOICE_OPTIONS[DEFAULT_CLASS]?.[0] ?? "";
        setNewChar({ name: "", race: DEFAULT_RACE, class: DEFAULT_CLASS, subChoice: defSub });
      }
    }
  });

  const activeParty = characters.filter(c => c.status === "active");
  const pendingChars = characters.filter(c => c.status === "pending");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChar.name.trim()) return;
    const subChoiceKey = getSubChoiceKey(newChar.race, newChar.class);
    createChar({ data: { ...newChar, username, subChoice: subChoiceKey ? newChar.subChoice : undefined } });
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">

      {/* Header & Create */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary text-glow mb-2">Hall of Heroes</h1>
          <p className="text-muted-foreground text-lg">Manage your party and roster. Click any card to see the full character sheet.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:brightness-110 flex items-center gap-2 transition-all">
              <UserPlus className="w-5 h-5" /> Roll New Character
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-primary/20 glass-panel">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-primary border-b border-white/10 pb-4">Create Adventurer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase">Character Name</label>
                <input
                  required
                  type="text"
                  value={newChar.name}
                  onChange={e => setNewChar({ ...newChar, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  placeholder="e.g. Thorin Oakenshield"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase">Race</label>
                  <select
                    value={newChar.race}
                    onChange={e => {
                      const newRace = e.target.value;
                      const subKey = getSubChoiceKey(newRace, newChar.class);
                      const firstSub = subKey ? (SUB_CHOICE_OPTIONS[subKey]?.[0] ?? "") : "";
                      setNewChar({ ...newChar, race: newRace, subChoice: firstSub });
                    }}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50 capitalize"
                  >
                    {RACES.map(r => (
                      <option key={r} value={r}>{RACE_ICONS[r]} {r}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase">Class</label>
                  <select
                    value={newChar.class}
                    onChange={e => {
                      const newClass = e.target.value;
                      const subKey = getSubChoiceKey(newChar.race, newClass);
                      const firstSub = subKey ? (SUB_CHOICE_OPTIONS[subKey]?.[0] ?? "") : "";
                      setNewChar({ ...newChar, class: newClass, subChoice: firstSub });
                    }}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50 capitalize"
                  >
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{CLASS_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Conditional sub-choice dropdown */}
              {(() => {
                const subKey = getSubChoiceKey(newChar.race, newChar.class);
                if (!subKey) return null;
                const opts = SUB_CHOICE_OPTIONS[subKey] ?? [];
                const label = SUB_CHOICE_LABELS[subKey] ?? "Specialization";
                return (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-sm font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-2">
                      <Star className="w-3 h-3" />
                      {label}
                    </label>
                    <select
                      value={newChar.subChoice}
                      onChange={e => setNewChar({ ...newChar, subChoice: e.target.value })}
                      className="w-full px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg text-foreground focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/50 capitalize font-semibold"
                    >
                      {opts.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-4 py-4 bg-primary text-primary-foreground font-serif font-bold text-xl rounded-lg shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isCreating ? "Forging..." : "Forge Destiny"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Party */}
      <section>
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-2">
          <Swords className="w-6 h-6 text-emerald-400" />
          <h2 className="font-serif text-2xl font-bold text-foreground">Active Party ({activeParty.length}/4)</h2>
        </div>
        {activeParty.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed border-white/20">
            <p className="text-muted-foreground text-lg">No heroes currently in the party. Add some from the roster below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {activeParty.map(char => <CharacterCard key={char.id} char={char} isActive={true} activePartyCount={activeParty.length} />)}
          </div>
        )}
      </section>

      {/* Pending Roster */}
      <section>
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-2">
          <Users className="w-6 h-6 text-muted-foreground" />
          <h2 className="font-serif text-2xl font-bold text-foreground">Pending Roster</h2>
        </div>
        {pendingChars.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed border-white/20">
            <p className="text-muted-foreground text-lg">Your roster is empty. Roll a new character above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {pendingChars.map(char => <CharacterCard key={char.id} char={char} isActive={false} activePartyCount={activeParty.length} />)}
          </div>
        )}
      </section>

    </div>
  );
}
