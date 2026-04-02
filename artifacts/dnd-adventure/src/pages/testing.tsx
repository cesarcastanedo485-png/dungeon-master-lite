import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FlaskConical, ScrollText, Terminal } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { getLookupData, type LookupEntry } from "@/lib/lookup-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Matches dashboard LOOKUP_TERMS — resolves with local getLookupData (no API). */
const LOOKUP_TERMS = new Set([
  "wizard",
  "cleric",
  "fighter",
  "rogue",
  "hunter",
  "tiefling",
  "dragonborn",
  "human",
  "elf",
  "halfling",
  "gnome",
]);

type LogKind = "player" | "system" | "dm" | "lookup";

interface LogBase {
  id: string;
}

interface PlayerLog extends LogBase {
  kind: "player";
  text: string;
  user: string;
}

interface TextLog extends LogBase {
  kind: "system" | "dm";
  text: string;
}

interface LookupLog extends LogBase {
  kind: "lookup";
  entry: LookupEntry;
}

type LogLine = PlayerLog | TextLog | LookupLog;

let logId = 0;
function nextId() {
  return `t-${++logId}`;
}

function simulateCommand(raw: string, username: string): LogLine[] {
  const cmd = raw.trim();
  if (!cmd) return [];

  const lines: LogLine[] = [
    { id: nextId(), kind: "player", text: cmd, user: username },
  ];

  if (cmd.toLowerCase().startsWith("!create")) {
    const parts = cmd.split(/\s+/).filter(Boolean);
    if (parts.length >= 4) {
      const race = parts[1] ?? "";
      const cls = parts[2] ?? "";
      const name = parts.slice(3).join(" ");
      lines.push({
        id: nextId(),
        kind: "system",
        text: `Parsed: ${name} — ${race} ${cls}. In the full app this calls the API to add them to the party. (Offline demo — nothing was saved.)`,
      });
    } else {
      lines.push({
        id: nextId(),
        kind: "system",
        text: "Usage: !create <race> <class> <name> — e.g. !create elf wizard Luna",
      });
    }
    return lines;
  }

  if (cmd.toLowerCase().startsWith("!party") || cmd.toLowerCase().startsWith("!sheet")) {
    lines.push({
      id: nextId(),
      kind: "system",
      text: "In the full app this jumps to **Characters** to show the party or your sheet. Use the nav link while you explore.",
    });
    return lines;
  }

  if (cmd.toLowerCase().startsWith("!action")) {
    const desc = cmd.replace(/^!action\s*/i, "").trim() || "(no description yet)";
    lines.push({
      id: nextId(),
      kind: "dm",
      text: `*[Demo only — no AI]* The Chronicler would narrate what happens when you: “${desc}”. On the real **Adventure** tab this streams from the game server.`,
    });
    return lines;
  }

  const lookupMatch = cmd.match(/^!(\w+)$/i);
  const term = lookupMatch?.[1]?.toLowerCase() ?? "";
  if (lookupMatch) {
    if (LOOKUP_TERMS.has(term)) {
      const entry = getLookupData(term);
      if (entry) {
        lines.push({ id: nextId(), kind: "lookup", entry });
      }
    } else {
      lines.push({
        id: nextId(),
        kind: "system",
        text: `!${term} isn’t in the offline lookup list. Try !wizard, !elf, !fighter, …`,
      });
    }
    return lines;
  }

  lines.push({
    id: nextId(),
    kind: "system",
    text: "With an active session on the **Adventure** tab, plain text is sent to the DM as your action (and may stream a reply). This preview never calls the API.",
  });
  return lines;
}

const COMMAND_REFERENCE: { cmd: string; note: string }[] = [
  { cmd: "!create <race> <class> <name>", note: "Roll a hero — demo parses only." },
  { cmd: "!action <description>", note: "Show what an action line looks like — no stream." },
  { cmd: "!party", note: "Full app: party view → points you to Characters." },
  { cmd: "!sheet", note: "Full app: your character sheet → Characters." },
  { cmd: "!wizard, !elf, …", note: "Compendium pop-ups — data is local in this demo." },
  { cmd: "Plain text", note: "Full app: treated as dialogue/action when the game is running." },
];

function LookupCard({ entry }: { entry: LookupEntry }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-black/50 p-4 text-left space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {entry.icon}
        </span>
        <div>
          <p className="font-serif font-bold text-primary text-lg">{entry.name}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {entry.type}
          </p>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{entry.desc}</p>
      {entry.traits && entry.traits.length > 0 && (
        <p className="text-xs text-amber-200/80">
          <span className="font-bold text-amber-400">Traits: </span>
          {entry.traits.join(" · ")}
        </p>
      )}
    </div>
  );
}

export default function TestingPage() {
  const { username } = useUser();
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const lines = simulateCommand(input, username);
    setLog((prev) => [...prev, ...lines]);
    setInput("");
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* Main column — mirrors Adventure “tale” panel */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden border-primary/20 shadow-2xl relative min-h-[420px]">
        <div className="absolute inset-0 bg-parchment opacity-35 z-0 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10 border-b border-primary/20 bg-black/60 backdrop-blur-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-violet-400" />
            <h2 className="font-serif text-lg font-bold text-primary tracking-wide uppercase">
              Command testing
            </h2>
          </div>
          <span className="text-xs font-mono text-violet-300/90 bg-violet-950/40 border border-violet-500/30 px-2 py-1 rounded">
            Offline — no API / no AI
          </span>
        </div>

        <p className="relative z-10 px-4 py-2 text-xs text-muted-foreground border-b border-white/5 bg-black/20">
          Try the same chat commands as on <strong className="text-foreground">Adventure</strong>. Responses
          here are mocked or read from local compendium data only.
        </p>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {log.length === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground gap-3 px-4">
              <Terminal className="w-10 h-10 opacity-40" />
              <p className="font-serif text-lg text-foreground/70">Type a command below to see the demo.</p>
              <p className="text-sm max-w-md">
                Start with <code className="text-amber-300/90">!create elf wizard Luna</code> or{" "}
                <code className="text-amber-300/90">!wizard</code>.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {log.map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl p-4 border",
                    line.kind === "player" &&
                      "ml-auto max-w-[90%] bg-primary/10 border-primary/30 text-primary-foreground",
                    line.kind === "system" &&
                      "mx-auto max-w-2xl bg-muted/20 border-white/10 text-muted-foreground text-sm",
                    line.kind === "dm" &&
                      "mr-auto max-w-[90%] bg-black/50 border-primary/20 text-slate-200 font-serif",
                    line.kind === "lookup" && "mx-auto max-w-lg border-primary/25",
                  )}
                >
                  {line.kind === "player" && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary/70 mb-1">
                        {line.user}
                      </p>
                      <p className="font-mono text-sm whitespace-pre-wrap">{line.text}</p>
                    </div>
                  )}
                  {line.kind === "system" && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{line.text}</p>
                  )}
                  {line.kind === "dm" && <p className="text-base leading-relaxed">{line.text}</p>}
                  {line.kind === "lookup" && <LookupCard entry={line.entry} />}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSubmit}
          className="relative z-10 p-4 border-t border-primary/20 bg-black/70 backdrop-blur-md"
        >
          <div className="relative flex items-center">
            <ChevronRight className="absolute left-4 w-5 h-5 text-violet-400/60" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Try !action I open the chest — playing as ${username}`}
              className="w-full pl-12 pr-24 py-3.5 bg-white/5 border border-white/10 rounded-xl text-foreground font-mono text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/30"
            />
            <Button
              type="submit"
              className="absolute right-2 h-9 bg-violet-700/80 hover:bg-violet-600"
              disabled={!input.trim()}
            >
              Run
            </Button>
          </div>
        </form>
      </div>

      {/* Reference column */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
        <div className="glass-panel rounded-xl border-primary/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <ScrollText className="w-4 h-4" />
            <h3 className="font-serif font-bold">Command list</h3>
          </div>
          <ul className="space-y-3 text-sm">
            {COMMAND_REFERENCE.map((row) => (
              <li key={row.cmd} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <code className="text-amber-200/90 text-xs block mb-1">{row.cmd}</code>
                <span className="text-muted-foreground text-xs leading-snug">{row.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-xl border-primary/20 p-4 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Lookup shortcuts
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Classes: <code className="text-amber-200/80">!wizard</code>{" "}
            <code className="text-amber-200/80">!cleric</code>{" "}
            <code className="text-amber-200/80">!fighter</code>{" "}
            <code className="text-amber-200/80">!rogue</code>{" "}
            <code className="text-amber-200/80">!hunter</code>
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Races: <code className="text-amber-200/80">!elf</code>{" "}
            <code className="text-amber-200/80">!human</code>{" "}
            <code className="text-amber-200/80">!tiefling</code>{" "}
            <code className="text-amber-200/80">!dragonborn</code>{" "}
            <code className="text-amber-200/80">!halfling</code>{" "}
            <code className="text-amber-200/80">!gnome</code>
          </p>
        </div>

        <Link href="/characters">
          <Button variant="outline" className="w-full border-primary/30 font-serif">
            Open Characters (full app)
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full text-muted-foreground">
            ← Back to Adventure
          </Button>
        </Link>
      </div>
    </div>
  );
}
