import { useState, useRef, useCallback } from "react";
import { Music, Volume2, VolumeX, Play, Pause, RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Audio files generated with ffmpeg — served from the Vite public directory.
// BASE_URL is prepended at runtime so the paths work under any base path prefix.
function audioUrl(filename: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base.endsWith("/") ? base : base + "/"}audio/${filename}`;
}

const MUSIC_TRACKS = [
  { id: "tavern",   name: "Tavern Revelry",  emoji: "🍺", desc: "Warm tavern ambience",             url: audioUrl("tavern.mp3"),   defaultLoop: true  },
  { id: "battle",   name: "Battle Theme",    emoji: "⚔️", desc: "Intense rhythmic combat",           url: audioUrl("battle.mp3"),   defaultLoop: true  },
  { id: "dungeon",  name: "Dungeon Depths",  emoji: "🕯️", desc: "Eerie underground atmosphere",      url: audioUrl("dungeon.mp3"),  defaultLoop: true  },
  { id: "forest",   name: "Forest Path",     emoji: "🌲", desc: "Peaceful nature exploration",       url: audioUrl("forest.mp3"),   defaultLoop: true  },
  { id: "victory",  name: "Victory Fanfare", emoji: "🏆", desc: "Triumphant victory theme",          url: audioUrl("victory.mp3"),  defaultLoop: false },
  { id: "mystical", name: "Arcane Realm",    emoji: "✨", desc: "Mystical spellcasting atmosphere",  url: audioUrl("mystical.mp3"), defaultLoop: true  },
] as const;

const SFX_TRACKS = [
  { id: "sword",   name: "Sword Clash", emoji: "⚔️", url: audioUrl("sword.mp3")   },
  { id: "spell",   name: "Spell Cast",  emoji: "🌟", url: audioUrl("spell.mp3")   },
  { id: "roar",    name: "Roar",        emoji: "🐉", url: audioUrl("roar.mp3")    },
  { id: "door",    name: "Door Creak",  emoji: "🚪", url: audioUrl("door.mp3")    },
  { id: "levelup", name: "Level Up!",   emoji: "⬆️", url: audioUrl("levelup.mp3") },
  { id: "dice",    name: "Dice Roll",   emoji: "🎲", url: audioUrl("dice.mp3")    },
] as const;

type MusicId = (typeof MUSIC_TRACKS)[number]["id"];
type SfxId = (typeof SFX_TRACKS)[number]["id"];

export function Soundboard() {
  const [playingMusic, setPlayingMusic] = useState<MusicId | null>(null);
  const [loopEnabled, setLoopEnabled] = useState<Record<MusicId, boolean>>(
    Object.fromEntries(MUSIC_TRACKS.map(t => [t.id, t.defaultLoop])) as Record<MusicId, boolean>
  );
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [sfxPlaying, setSfxPlaying] = useState<Set<SfxId>>(new Set());

  // Refs for music Audio objects (lazily created)
  const musicRefs = useRef<Partial<Record<MusicId, HTMLAudioElement>>>({});
  // Refs for SFX Audio objects (one-shot, created fresh each play)
  const sfxRefs = useRef<Partial<Record<SfxId, HTMLAudioElement>>>({});

  const getEffectiveVolume = useCallback(
    (vol: number) => (isMuted ? 0 : vol),
    [isMuted]
  );

  // Lazily create or retrieve a music Audio element
  const getMusicAudio = useCallback((track: (typeof MUSIC_TRACKS)[number]): HTMLAudioElement => {
    if (!musicRefs.current[track.id]) {
      const audio = new Audio(track.url);
      audio.loop = loopEnabled[track.id];
      audio.volume = getEffectiveVolume(volume);
      audio.preload = "none";
      audio.addEventListener("error", () => {
        setLoadErrors(prev => new Set(prev).add(track.id));
      });
      audio.addEventListener("ended", () => {
        if (!audio.loop) {
          setPlayingMusic(prev => (prev === track.id ? null : prev));
        }
      });
      musicRefs.current[track.id] = audio;
    }
    return musicRefs.current[track.id]!;
  }, [loopEnabled, volume, getEffectiveVolume]);

  // Stop all music tracks except optionally one
  const stopAllMusic = useCallback((exceptId?: MusicId) => {
    for (const t of MUSIC_TRACKS) {
      if (t.id === exceptId) continue;
      const audio = musicRefs.current[t.id];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, []);

  const handleMusicToggle = useCallback((track: (typeof MUSIC_TRACKS)[number]) => {
    const audio = getMusicAudio(track);
    if (playingMusic === track.id) {
      // Pause
      audio.pause();
      setPlayingMusic(null);
    } else {
      // Stop others, then play
      stopAllMusic(track.id);
      audio.volume = getEffectiveVolume(volume);
      audio.loop = loopEnabled[track.id];
      audio.play().catch(() => {
        setLoadErrors(prev => new Set(prev).add(track.id));
      });
      setPlayingMusic(track.id);
    }
  }, [playingMusic, getMusicAudio, stopAllMusic, getEffectiveVolume, volume, loopEnabled]);

  const handleLoopToggle = useCallback((trackId: MusicId) => {
    setLoopEnabled(prev => {
      const next = { ...prev, [trackId]: !prev[trackId] };
      // Apply to existing audio if loaded
      const audio = musicRefs.current[trackId];
      if (audio) audio.loop = next[trackId];
      return next;
    });
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    const effVol = isMuted ? 0 : newVol;
    for (const t of MUSIC_TRACKS) {
      const audio = musicRefs.current[t.id];
      if (audio) audio.volume = effVol;
    }
  }, [isMuted]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => {
      const muting = !prev;
      const effVol = muting ? 0 : volume;
      for (const t of MUSIC_TRACKS) {
        const audio = musicRefs.current[t.id];
        if (audio) audio.volume = effVol;
      }
      return muting;
    });
  }, [volume]);

  const handleSfxPlay = useCallback((track: (typeof SFX_TRACKS)[number]) => {
    // Create a fresh Audio element each time for overlapping SFX
    const audio = new Audio(track.url);
    audio.volume = getEffectiveVolume(volume);
    sfxRefs.current[track.id] = audio;
    setSfxPlaying(prev => new Set(prev).add(track.id));
    audio.addEventListener("ended", () => {
      setSfxPlaying(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    });
    audio.addEventListener("error", () => {
      setLoadErrors(prev => new Set(prev).add(track.id));
      setSfxPlaying(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    });
    audio.play().catch(() => {
      setLoadErrors(prev => new Set(prev).add(track.id));
      setSfxPlaying(prev => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    });
  }, [getEffectiveVolume, volume]);

  const handleStopAll = useCallback(() => {
    stopAllMusic();
    setPlayingMusic(null);
    for (const t of SFX_TRACKS) {
      const audio = sfxRefs.current[t.id];
      if (audio) { audio.pause(); audio.currentTime = 0; }
    }
    setSfxPlaying(new Set());
  }, [stopAllMusic]);

  return (
    <div className="p-3 space-y-4">
      {/* Volume Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleMuteToggle}
          className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={e => handleVolumeChange(Number(e.target.value))}
          className="flex-1 h-1.5 accent-violet-400 cursor-pointer"
          title="Master Volume"
        />
        <button
          onClick={handleStopAll}
          className="shrink-0 p-1.5 rounded-md hover:bg-red-900/40 text-white/40 hover:text-red-400 transition-colors"
          title="Stop all sounds"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ambient Music */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Music className="w-3 h-3" /> Ambient Music
        </p>
        <div className="space-y-1">
          {MUSIC_TRACKS.map(track => {
            const isPlaying = playingMusic === track.id;
            const hasError = loadErrors.has(track.id);
            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all",
                  isPlaying
                    ? "bg-violet-900/30 border-violet-500/40"
                    : "bg-black/30 border-white/5 hover:border-white/15"
                )}
              >
                <span className="text-base select-none w-5 text-center">{track.emoji}</span>

                <button
                  onClick={() => handleMusicToggle(track)}
                  disabled={hasError}
                  className={cn(
                    "flex-1 text-left text-xs font-medium truncate transition-colors",
                    isPlaying ? "text-violet-300" : "text-white/70 hover:text-white/90",
                    hasError && "opacity-40 cursor-not-allowed"
                  )}
                  title={track.desc}
                >
                  {track.name}
                  {hasError && <span className="text-red-500/60 ml-1">(unavailable)</span>}
                </button>

                {/* Loop toggle */}
                <button
                  onClick={() => handleLoopToggle(track.id)}
                  className={cn(
                    "shrink-0 p-1 rounded text-[10px] font-bold transition-colors",
                    loopEnabled[track.id]
                      ? "text-violet-400 bg-violet-900/30"
                      : "text-white/30 hover:text-white/60"
                  )}
                  title="Toggle loop"
                >
                  ↻
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => handleMusicToggle(track)}
                  disabled={hasError}
                  className={cn(
                    "shrink-0 p-1 rounded transition-colors disabled:opacity-30",
                    isPlaying
                      ? "text-violet-400 hover:text-violet-300"
                      : "text-white/40 hover:text-white/80"
                  )}
                >
                  {isPlaying
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sound Effects */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3" /> Sound Effects
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SFX_TRACKS.map(track => {
            const isActive = sfxPlaying.has(track.id);
            const hasError = loadErrors.has(track.id);
            return (
              <button
                key={track.id}
                onClick={() => handleSfxPlay(track)}
                disabled={hasError}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all active:scale-95",
                  isActive
                    ? "bg-amber-900/40 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    : hasError
                    ? "bg-black/20 border-white/5 text-white/20 cursor-not-allowed"
                    : "bg-black/30 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white/90"
                )}
                title={hasError ? "Sound unavailable" : `Play ${track.name}`}
              >
                <span className="text-lg select-none leading-none">{track.emoji}</span>
                <span className="truncate w-full text-center leading-tight" style={{ fontSize: "9px" }}>
                  {track.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
