import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, Play, Pause, RotateCcw, Send, ScrollText,
  User, ChevronRight, Users, Save, FolderOpen, Trash2,
  BookOpen, Sparkles, X, Radio, WifiOff, MessageCircle,
  Volume2, VolumeX, Music
} from "lucide-react";
import {
  useGetGameState,
  useStartGame,
  usePauseGame,
  useResetGame,
  useGetNarrative,
  useListCharacters,
  useGenerateDmName,
  useListCampaigns,
  useSaveCampaign,
  useLoadCampaign,
  useDeleteCampaign,
  getGetGameStateQueryKey,
  getGetNarrativeQueryKey,
  getListCharactersQueryKey,
  getListCampaignsQueryKey,
  useCreateCharacter
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useActionStream } from "@/hooks/use-action-stream";
import { useGameEvents } from "@/hooks/use-game-events";
import { cn, safeFormatDate } from "@/lib/utils";
import { Soundboard } from "@/components/soundboard";

// Strip markdown and special tokens so TTS sounds natural
function cleanTextForTTS(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`(.+?)`/gs, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/AWARD_XP:\d+/g, "")
    .replace(/[_~|>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Prefer a British male voice; fall back gracefully
function getBritishMaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.name.toLowerCase().includes("uk english male")) ??
    voices.find(v => v.lang === "en-GB" && v.name.toLowerCase().includes("male")) ??
    voices.find(v => v.lang === "en-GB") ??
    voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ??
    null
  );
}

function HPBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const safeMax = maxHp > 0 ? maxHp : 1;
  const safeHp = Number.isFinite(hp) ? hp : 0;
  const percentage = Math.max(0, Math.min(100, (safeHp / safeMax) * 100));
  const colorClass = percentage > 50 ? 'bg-emerald-500' : percentage > 25 ? 'bg-amber-500' : 'bg-destructive';
  return (
    <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-2 shadow-inner">
      <div
        className={cn("h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]", colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Parchment scroll with pre-game instructions styled in-character
function ParchmentInstructions({ dmName }: { dmName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={cn(
          "relative rounded-2xl border-2 border-amber-700/60 shadow-[0_0_40px_rgba(180,120,40,0.2)]",
          "bg-gradient-to-b from-[#2a1f0e] via-[#1e1608] to-[#2a1f0e]",
          "px-8 py-7"
        )}
      >
        {/* Decorative corner ornaments */}
        <span className="absolute top-3 left-3 text-amber-600/50 text-xl select-none">❧</span>
        <span className="absolute top-3 right-3 text-amber-600/50 text-xl select-none rotate-90">❧</span>
        <span className="absolute bottom-3 left-3 text-amber-600/50 text-xl select-none -rotate-90">❧</span>
        <span className="absolute bottom-3 right-3 text-amber-600/50 text-xl select-none rotate-180">❧</span>

        {/* Title */}
        <div className="text-center mb-5">
          <p className="text-amber-500/60 text-xs uppercase tracking-[0.3em] font-bold mb-1">A Message from your Chronicler</p>
          <h3 className="font-serif text-2xl font-bold text-amber-300 tracking-wide drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
            {dmName} speaks…
          </h3>
          <div className="mt-2 h-px bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
        </div>

        {/* Body text */}
        <div className="font-serif text-amber-100/80 leading-relaxed space-y-3 text-[0.97rem]">
          <p>
            "Heed well, brave souls, for your journey is about to begin. I am <strong className="text-amber-300">{dmName}</strong>, and I shall be your guide through glory, peril, and the unknown."
          </p>
          <p>
            "To <strong className="text-amber-300">forge your destiny</strong>, speak the words of creation in the chat below:"
          </p>

          <div className="bg-black/40 border border-amber-700/30 rounded-lg px-4 py-3 space-y-1.5 my-2">
            <p className="text-amber-400 text-sm font-mono">!create [race] [class] [name]</p>
            <p className="text-amber-100/60 text-xs">e.g. <span className="text-amber-300 font-mono">!create elf wizard Luna</span></p>
            <div className="mt-2 pt-2 border-t border-amber-700/20 space-y-1 text-xs text-amber-100/50">
              <p><span className="text-amber-400 font-mono">!action [description]</span> — declare your action</p>
              <p><span className="text-amber-400 font-mono">!sheet</span> — view your character</p>
              <p><span className="text-amber-400 font-mono">!party</span> — see the fellowship</p>
            </div>
          </div>

          <p className="text-sm text-amber-100/60">
            <strong className="text-amber-300">The Laws of this Realm:</strong> No more than four heroes may walk together at once. Only the active party may act; others must wait or join during a pause. This adventure was crafted by <strong className="text-amber-300">Mortyy himself</strong> — join the party and shape the tale!
          </p>
        </div>

        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
        <p className="text-center text-amber-500/40 text-xs mt-3 italic">
          — {dmName}, Master of Chronicles —
        </p>
      </div>
    </motion.div>
  );
}

// Save Campaign modal/panel
function SaveCampaignPanel({ onClose }: { onClose: () => void }) {
  const [campaignName, setCampaignName] = useState("");
  const queryClient = useQueryClient();
  const { mutate: saveCampaign, isPending } = useSaveCampaign({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        onClose();
      }
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-[#1a1208] border border-amber-700/40 rounded-xl p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
          <Save className="w-4 h-4" /> Save Campaign
        </h4>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="text"
        value={campaignName}
        onChange={e => setCampaignName(e.target.value)}
        placeholder='e.g. "Forest Quest"'
        className="w-full px-3 py-2 bg-black/40 border border-amber-700/30 rounded-lg text-sm text-foreground focus:outline-none focus:border-amber-600/60 mb-3"
      />
      <button
        onClick={() => saveCampaign({ data: { name: campaignName || "Untitled Campaign" } })}
        disabled={isPending}
        className="w-full py-2 bg-amber-700/40 hover:bg-amber-700/60 border border-amber-600/40 text-amber-200 font-bold text-sm rounded-lg transition-all"
      >
        {isPending ? "Saving..." : "Save to Chronicle"}
      </button>
    </motion.div>
  );
}

// Load Campaign panel
function LoadCampaignPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: campaigns = [] } = useListCampaigns();
  const { mutate: loadCampaign, isPending: isLoading } = useLoadCampaign({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
        onClose();
      }
    }
  });
  const { mutate: deleteCampaign } = useDeleteCampaign({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-[#1a1208] border border-amber-700/40 rounded-xl p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4" /> Load Campaign
        </h4>
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-3 italic">No campaigns saved yet.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-black/30 border border-amber-700/20 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-amber-200 text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.dmName} · {safeFormatDate(c.savedAt, "MMM d, HH:mm")}
                </p>
              </div>
              <button
                onClick={() => loadCampaign({ id: c.id })}
                disabled={isLoading}
                className="px-2 py-1 bg-amber-700/30 hover:bg-amber-700/50 text-amber-300 text-xs font-bold rounded transition-all shrink-0"
              >
                Load
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${c.name}"?`)) deleteCampaign({ id: c.id });
                }}
                className="p-1 text-destructive/50 hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { username } = useUser();
  const queryClient = useQueryClient();
  const [command, setCommand] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [isGeneratingDmName, setIsGeneratingDmName] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokConnecting, setTiktokConnecting] = useState(false);
  const [tiktokViewerCount, setTiktokViewerCount] = useState(0);
  const [tiktokChatLog, setTiktokChatLog] = useState<Array<{ username: string; message: string }>>([]);
  const [tiktokPanelOpen, setTiktokPanelOpen] = useState(true);
  const tiktokChatEndRef = useRef<HTMLDivElement>(null);

  // Soundboard + TTS state
  const [soundboardPanelOpen, setSoundboardPanelOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { lastEvent } = useGameEvents();

  const { data: gameState, isLoading: isStateLoading } = useGetGameState();
  const { data: narrativeData, isLoading: isNarrativeLoading } = useGetNarrative();
  const narrative = Array.isArray(narrativeData) ? narrativeData : [];
  const { data: charactersData } = useListCharacters();
  const characters = Array.isArray(charactersData) ? charactersData : [];

  const { mutate: generateDmNameMutation } = useGenerateDmName({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        setIsGeneratingDmName(false);
      }
    }
  });

  const { mutate: startGame, isPending: isStarting } = useStartGame({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() }) }
  });
  const { mutate: pauseGame, isPending: isPausing } = usePauseGame({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        // Auto-prompt to save on pause if there's narrative
        if (narrative.length > 0) {
          setShowSavePanel(true);
          setShowLoadPanel(false);
        }
      }
    }
  });
  const { mutate: resetGame, isPending: isResetting } = useResetGame({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
        setShowSavePanel(false);
        setShowLoadPanel(false);
      }
    }
  });

  const { mutate: createChar } = useCreateCharacter({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() }) }
  });

  const { performActionStream, isStreaming, streamedText } = useActionStream();

  const activeParty = characters.filter(c => c.status === 'active');
  const dmName = gameState?.dmName ?? "The Chronicler";

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [narrative, streamedText]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "tiktok-chat" && lastEvent.username && lastEvent.message) {
      setTiktokChatLog(prev => [...prev.slice(-49), { username: lastEvent.username!, message: lastEvent.message! }]);
    }

    if (lastEvent.type === "tiktok-status") {
      if (lastEvent.status === "connected") {
        setTiktokConnected(true);
        setTiktokConnecting(false);
        setTiktokChatLog(prev => [...prev, { username: "System", message: `Connected to @${lastEvent.uniqueId ?? "stream"}` }]);
      } else if (lastEvent.status === "disconnected") {
        setTiktokConnected(false);
        setTiktokConnecting(false);
        if (lastEvent.reason) {
          setTiktokChatLog(prev => [...prev, { username: "System", message: lastEvent.reason! }]);
        }
      }
    }

  }, [lastEvent]);

  useEffect(() => {
    tiktokChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tiktokChatLog]);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch("/api/tiktok/status");
        if (res.ok) {
          const data = await res.json() as { isConnected: boolean; viewerCount: number; uniqueId: string | null };
          setTiktokConnected(data.isConnected);
          setTiktokViewerCount(data.viewerCount);
          if (data.uniqueId && !tiktokUsername) {
            setTiktokUsername(data.uniqueId);
          }
        }
      } catch {
        // ignore polling errors
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [tiktokUsername]);

  // Generate DM name when game becomes active and has no name
  useEffect(() => {
    if (gameState?.status === "active" && !gameState?.dmName && !isGeneratingDmName) {
      setIsGeneratingDmName(true);
      generateDmNameMutation();
    }
  }, [gameState?.status, gameState?.dmName, isGeneratingDmName, generateDmNameMutation]);

  const LOOKUP_TERMS = new Set([
    "wizard", "cleric", "fighter", "rogue", "hunter",
    "tiefling", "dragonborn", "human", "elf", "halfling", "gnome",
  ]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isStreaming) return;
    const cmd = command.trim();

    if (cmd.startsWith("!create")) {
      const parts = cmd.split(" ");
      if (parts.length >= 4) {
        createChar({
          data: { username, race: parts[1] ?? "", class: parts[2] ?? "", name: parts.slice(3).join(" ") }
        });
      }
    } else if (cmd.startsWith("!party") || cmd.startsWith("!sheet")) {
      setLocation("/characters");
    } else if (cmd.startsWith("!action")) {
      performActionStream(username, cmd.replace("!action", "").trim());
    } else {
      const lookupMatch = cmd.match(/^!(\w+)$/i);
      const lookupTerm = lookupMatch?.[1]?.toLowerCase() ?? "";
      if (lookupMatch && LOOKUP_TERMS.has(lookupTerm)) {
        fetch("/api/game/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ term: lookupTerm }),
        }).catch(console.error);
      } else if (gameState?.status === "active") {
        performActionStream(username, cmd);
      }
    }
    setCommand("");
  };

  const handleStartGame = useCallback(() => {
    // Generate DM name if not already set
    if (!gameState?.dmName) {
      setIsGeneratingDmName(true);
      generateDmNameMutation();
    }
    startGame();
  }, [gameState?.dmName, generateDmNameMutation, startGame]);

  const handleResetGame = useCallback(() => {
    if (narrative.length > 0) {
      const shouldSave = confirm("Save campaign before resetting?");
      if (shouldSave) { setShowSavePanel(true); return; }
    }
    if (confirm("Are you sure? This will wipe the story and return to idle.")) {
      resetGame();
    }
  }, [narrative.length, resetGame]);

  // TTS: speak text with British male voice preference
  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForTTS(text));
    utterance.rate = 0.88;
    utterance.pitch = 0.82;
    utterance.volume = 1;
    const applyVoice = () => {
      const voice = getBritishMaleVoice();
      if (voice) utterance.voice = voice;
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoice();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", applyVoice, { once: true });
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const handleReadDmResponse = useCallback(() => {
    if (isSpeaking) { stopSpeaking(); return; }
    const lastDm = [...narrative].reverse().find(e => e.type === "dm");
    if (lastDm) speakText(lastDm.content);
  }, [isSpeaking, stopSpeaking, narrative, speakText]);

  const handleReadInstructions = useCallback(() => {
    if (isSpeaking) { stopSpeaking(); return; }
    const script = `Ahoy, adventurers! I am ${dmName}, your magnificently chaotic guide through this realm of glory and questionable life choices. This entire adventure was hand-crafted by Mortyy himself — no dragons were harmed in the coding, though several keyboards paid the ultimate price.

Here's how to join this magnificent disaster. First, type exclamation-mark create, followed by your race, your class, and a heroic name. For example: exclamation-mark create, elf, wizard, Luna. Yes, you can be a gnome rogue named Kevin. We absolutely do not judge here.

Once you're in, type exclamation-mark action and describe whatever heroic — or not so heroic — deed you wish to attempt. Want to seduce the dragon? Go for it. Want to pickpocket the king? Bold choice, and frankly, I respect it.

Type exclamation-mark sheet to admire your glorious character stats, and exclamation-mark party to behold your fellow adventurers in all their chaotic glory.

Remember: up to four heroes at a time. And the Dungeon Master's word is law. Mostly. Now then — enough chit-chat. Adventure awaits, and those goblins aren't going to defeat themselves. Probably.`;
    speakText(script);
  }, [isSpeaking, stopSpeaking, dmName, speakText]);

  const handleTiktokConnect = useCallback(async () => {
    if (!tiktokUsername.trim()) return;
    setTiktokConnecting(true);
    try {
      const res = await fetch("/api/tiktok/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: tiktokUsername.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Connection failed");
        setTiktokConnecting(false);
      } else {
        setTiktokConnected(true);
        setTiktokConnecting(false);
      }
    } catch {
      alert("Failed to connect to TikTok Live");
      setTiktokConnecting(false);
    }
  }, [tiktokUsername]);

  const handleTiktokDisconnect = useCallback(async () => {
    try {
      await fetch("/api/tiktok/disconnect", { method: "POST" });
    } catch {
      // ignore
    }
    setTiktokConnected(false);
  }, []);

  if (isStateLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isIdle = gameState?.status === "idle";
  const isPaused = gameState?.status === "paused";

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

      {/* Left Panel: Narrative */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden border-primary/20 shadow-2xl relative">
        <div className="absolute inset-0 bg-parchment opacity-40 z-[-1] pointer-events-none mix-blend-overlay" />

        {/* Header — shows DM name, status badge, and TTS controls */}
        <div className="border-b border-primary/20 bg-black/60 backdrop-blur-sm px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <ScrollText className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-primary tracking-wider uppercase">Tale of the Realm</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* TTS: Read most recent DM response */}
            <button
              onClick={handleReadDmResponse}
              title={isSpeaking ? "Stop speaking" : "Read recent DM response aloud (British voice)"}
              disabled={narrative.filter(e => e.type === "dm").length === 0}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                isSpeaking
                  ? "bg-violet-600/30 border-violet-500/50 text-violet-300 animate-pulse"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-violet-900/30 hover:border-violet-500/30 hover:text-violet-300"
              )}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSpeaking ? "Stop" : "Read DM"}</span>
            </button>

            {/* TTS: Read instructions */}
            <button
              onClick={handleReadInstructions}
              title="Read game instructions aloud"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all",
                "bg-white/5 border-white/10 text-white/60 hover:bg-amber-900/30 hover:border-amber-500/30 hover:text-amber-300"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instructions</span>
            </button>

            {gameState?.dmName && (
              <span className="text-xs text-amber-400/70 font-serif italic hidden md:block">{dmName}</span>
            )}
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              gameState?.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
              gameState?.status === "paused" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
              "bg-muted/50 text-muted-foreground border-white/10"
            )}>
              {gameState?.status || "Unknown"}
            </span>
          </div>
        </div>

        {/* Narrative Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {isIdle && narrative.length === 0 && (
            <div className="space-y-6 flex flex-col items-center">
              <ParchmentInstructions dmName={dmName} />
              <button
                onClick={handleStartGame}
                disabled={isStarting || isGeneratingDmName}
                className="px-8 py-4 bg-primary text-primary-foreground font-serif font-bold text-xl rounded-lg shadow-lg hover:shadow-primary/25 hover:brightness-110 transition-all uppercase tracking-wider flex items-center gap-2"
              >
                {isGeneratingDmName ? (
                  <><Sparkles className="w-5 h-5 animate-pulse" /> Summoning the Chronicler…</>
                ) : (
                  <><Play className="w-5 h-5" /> Begin Adventure</>
                )}
              </button>
            </div>
          )}

          {isPaused && narrative.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <Pause className="w-12 h-12 text-amber-400" />
              <p className="font-serif text-xl text-amber-300">The tale is paused.</p>
              <p className="text-sm text-muted-foreground">Manage your party, then resume the adventure.</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {narrative.map((entry, idx) => (
              <motion.div
                key={entry.id || `temp-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "max-w-[85%] rounded-xl p-5 shadow-lg relative border",
                  entry.type === 'dm'
                    ? "mr-auto bg-black/60 border-primary/20 text-foreground"
                    : entry.type === 'player'
                    ? "ml-auto bg-primary/10 border-primary/30 text-primary-foreground"
                    : "mx-auto bg-muted/30 border-white/5 text-muted-foreground text-center italic max-w-sm"
                )}
              >
                {entry.type !== 'system' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      entry.type === 'dm' ? "text-primary" : "text-primary/80"
                    )}>
                      {/* Show custom DM name for DM messages */}
                      {entry.type === 'dm' ? dmName : entry.username}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {safeFormatDate(entry.createdAt, "HH:mm", "")}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "prose prose-invert max-w-none",
                  entry.type === 'dm' && "font-serif text-xl leading-relaxed text-slate-200",
                  entry.type === 'player' && "font-sans text-lg text-slate-100"
                )}>
                  {entry.content}
                </div>
              </motion.div>
            ))}

            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[85%] mr-auto rounded-xl p-5 shadow-lg relative border bg-black/60 border-primary/20 text-foreground"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{dmName}</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <div className="font-serif text-xl leading-relaxed text-slate-200">
                  {streamedText}
                  <span className="inline-block w-2 h-5 bg-primary/50 ml-1 animate-pulse align-middle" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/80 backdrop-blur-md border-t border-primary/20">
          <form onSubmit={handleCommandSubmit} className="relative flex items-center">
            <ChevronRight className="absolute left-4 w-5 h-5 text-primary/50" />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isIdle || isStreaming}
              placeholder={isIdle ? "Start the game to take actions..." : `What do you do, ${username}? (or type !action, !create, !sheet)`}
              className="w-full pl-12 pr-14 py-4 bg-white/5 border border-white/10 rounded-xl text-foreground font-sans text-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!command.trim() || isIdle || isStreaming}
              className="absolute right-3 p-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Party & Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto lg:overflow-y-auto pb-2">

        {/* Active Party */}
        <div className="glass-panel rounded-xl overflow-hidden border-primary/20 flex-1 flex flex-col relative min-h-0">
          <div className="absolute inset-0 bg-parchment opacity-20 z-[-1] pointer-events-none mix-blend-overlay" />
          <div className="h-14 border-b border-white/10 bg-black/40 flex items-center justify-between px-5">
            <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Active Party
            </h3>
            <span className="text-xs font-bold text-muted-foreground">{activeParty.length}/4</span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {activeParty.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-4">
                <User className="w-10 h-10 mb-2" />
                <p className="text-sm">No heroes have answered the call.</p>
              </div>
            ) : (
              activeParty.map(char => (
                <div key={char.id} className="bg-black/40 border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-serif font-bold text-lg text-primary">{char.name}</h4>
                    <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white/80">Lvl {char.level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    {char.race} {char.class} · <span className="text-white/40">{char.username}</span>
                  </p>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-red-400">HP {char.hp}/{char.maxHp}</span>
                    <span className="text-blue-400">XP {char.xp}</span>
                  </div>
                  <HPBar hp={char.hp} maxHp={char.maxHp} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="glass-panel rounded-xl p-4 border-primary/20 flex flex-col gap-3">
          {/* DM Name display */}
          {gameState?.dmName && (
            <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/5">
              <BookOpen className="w-3.5 h-3.5 text-amber-500/70" />
              <span className="text-xs text-amber-400/80 font-serif italic">{dmName}</span>
            </div>
          )}

          <h3 className="font-serif font-bold text-sm text-muted-foreground uppercase tracking-wider px-1">
            Dungeon Master Controls
          </h3>

          {isIdle ? (
            <button
              onClick={handleStartGame}
              disabled={isStarting || isGeneratingDmName}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all"
            >
              {isGeneratingDmName
                ? <><Sparkles className="w-4 h-4 animate-pulse" /> Summoning…</>
                : <><Play className="w-4 h-4" /> Start Session</>
              }
            </button>
          ) : (
            <button
              onClick={() => isPaused ? startGame() : pauseGame()}
              disabled={isStarting || isPausing}
              className="w-full py-3 bg-amber-600/20 border border-amber-600/50 text-amber-500 font-bold rounded-lg hover:bg-amber-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? "Resume Session" : "Pause Session"}
            </button>
          )}

          <button
            onClick={handleResetGame}
            disabled={isResetting}
            className="w-full py-3 bg-transparent border border-destructive/50 text-destructive font-bold rounded-lg hover:bg-destructive/10 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset Adventure
          </button>

          {/* Save / Load Campaign controls */}
          <div className="border-t border-white/5 pt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider px-1">Campaign Chronicle</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSavePanel(v => !v); setShowLoadPanel(false); }}
                className="flex-1 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/30 text-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => { setShowLoadPanel(v => !v); setShowSavePanel(false); }}
                className="flex-1 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/30 text-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Load
              </button>
            </div>
          </div>
        </div>

        {/* Save / Load Panels */}
        <AnimatePresence>
          {showSavePanel && (
            <SaveCampaignPanel onClose={() => setShowSavePanel(false)} />
          )}
          {showLoadPanel && (
            <LoadCampaignPanel onClose={() => setShowLoadPanel(false)} />
          )}
        </AnimatePresence>

        {/* Soundboard Panel */}
        <div className="glass-panel rounded-xl overflow-hidden border-primary/20 flex flex-col">
          <button
            onClick={() => setSoundboardPanelOpen(v => !v)}
            className="h-12 border-b border-white/10 bg-black/40 flex items-center justify-between px-4 w-full hover:bg-black/50 transition-colors"
          >
            <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
              <Music className="w-4 h-4 text-violet-400" /> Soundboard
            </h3>
            <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", soundboardPanelOpen && "rotate-90")} />
          </button>

          <AnimatePresence>
            {soundboardPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Soundboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TikTok Live Panel */}
        <div className="glass-panel rounded-xl overflow-hidden border-primary/20 flex flex-col">
          <button
            onClick={() => setTiktokPanelOpen(v => !v)}
            className="h-12 border-b border-white/10 bg-black/40 flex items-center justify-between px-4 w-full hover:bg-black/50 transition-colors"
          >
            <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-pink-500" /> TikTok Live
            </h3>
            <span className={cn(
              "flex items-center gap-1 text-xs font-bold",
              tiktokConnected ? "text-emerald-400" : "text-muted-foreground"
            )}>
              {tiktokConnected ? (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                  {tiktokViewerCount > 0 && <span className="text-white/50 ml-1">({tiktokViewerCount})</span>}
                </>
              ) : (
                <><span className="w-2 h-2 bg-gray-500 rounded-full" /> Offline</>
              )}
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform ml-1", tiktokPanelOpen && "rotate-90")} />
            </span>
          </button>

          <AnimatePresence>
            {tiktokPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {!tiktokConnected ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tiktokUsername}
                        onChange={e => setTiktokUsername(e.target.value)}
                        placeholder="TikTok @username"
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-pink-500/50 transition-all"
                        onKeyDown={e => e.key === "Enter" && handleTiktokConnect()}
                      />
                      <button
                        onClick={handleTiktokConnect}
                        disabled={!tiktokUsername.trim() || tiktokConnecting}
                        className="w-full py-2 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/30 text-pink-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {tiktokConnecting ? "Connecting..." : <><Radio className="w-3.5 h-3.5" /> Connect to Live</>}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleTiktokDisconnect}
                      className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <WifiOff className="w-3.5 h-3.5" /> Disconnect
                    </button>
                  )}

                  {tiktokChatLog.length > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-1 bg-black/30 rounded-lg p-2 border border-white/5">
                      {tiktokChatLog.map((msg, i) => (
                        <div key={i} className="flex gap-1.5 text-xs">
                          <span className="text-pink-400 font-bold shrink-0">{msg.username}:</span>
                          <span className="text-white/70 break-words min-w-0">{msg.message}</span>
                        </div>
                      ))}
                      <div ref={tiktokChatEndRef} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
