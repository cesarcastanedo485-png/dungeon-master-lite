import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameEvents } from "@/hooks/use-game-events";
import { getLookupData, type LookupEntry } from "@/lib/lookup-data";

const POPUP_DURATION = 10000;

export function LookupPopup() {
  const { lastEvent } = useGameEvents();
  const [entry, setEntry] = useState<LookupEntry | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const startCountdown = useCallback(() => {
    startRef.current = Date.now();
    setProgress(100);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, POPUP_DURATION);

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / POPUP_DURATION) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "lookup" || !lastEvent.term) return;

    const data = getLookupData(lastEvent.term);
    if (!data) return;

    setEntry(data);
    setVisible(true);
    startCountdown();
  }, [lastEvent, startCountdown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const accentColor = entry?.type === "class"
    ? "border-amber-500/50"
    : "border-emerald-500/50";

  const accentGlow = entry?.type === "class"
    ? "shadow-[0_0_40px_rgba(245,158,11,0.15)]"
    : "shadow-[0_0_40px_rgba(16,185,129,0.15)]";

  const progressColor = entry?.type === "class"
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <AnimatePresence>
      {visible && entry && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={cn(
            "fixed bottom-6 right-6 z-[100] w-[360px] max-w-[calc(100vw-2rem)]",
            "rounded-xl border-2 overflow-hidden",
            "bg-gradient-to-b from-[#1e1608] via-[#16120a] to-[#1a1408]",
            "backdrop-blur-xl",
            accentColor,
            accentGlow
          )}
        >
          <div className="h-1 w-full bg-black/40 overflow-hidden">
            <div
              className={cn("h-full transition-none", progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-2xl border border-white/10 shrink-0">
                {entry.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-amber-200">{entry.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    entry.type === "class"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  )}>
                    {entry.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">{entry.desc}</p>
              </div>
              <button
                onClick={dismiss}
                className="p-1 text-white/30 hover:text-white/70 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {entry.primaryStat && (
              <div className="mb-2 text-xs">
                <span className="text-slate-500">Primary: </span>
                <span className="text-amber-300 font-bold">{entry.primaryStat}</span>
              </div>
            )}

            {entry.traits && entry.traits.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {entry.traits.map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {entry.subChoiceLabel && entry.subChoiceOptions && (
              <div className="mb-3 bg-black/30 border border-white/5 rounded-lg px-2.5 py-2">
                <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider mb-1">{entry.subChoiceLabel}</p>
                <div className="flex flex-wrap gap-1">
                  {entry.subChoiceOptions.map(opt => (
                    <span key={opt} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-200">
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {entry.type === "class" ? "Skill Highlights" : "Racial Abilities"}
              </p>
              {entry.skillHighlights.map((skill) => (
                <div key={skill.name} className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5">
                  <span className="text-sm leading-none mt-0.5 shrink-0">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {skill.level > 0 && (
                        <span className="text-[9px] font-bold text-primary/50">Lv{skill.level}</span>
                      )}
                      <span className="font-bold text-slate-200 text-xs">{skill.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{skill.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
