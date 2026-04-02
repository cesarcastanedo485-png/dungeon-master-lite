"use client";

/**
 * Embeds a Godot HTML5 export from /public (no Node API, no OpenAI — static files only).
 * Copy this file into your portfolio: e.g. components/games/DungeonMasterLiteGodotEmbed.tsx
 */
export function DungeonMasterLiteGodotEmbed({
  title = "Dungeon Master Lite — browser demo",
  src = "/games/dml-godot/index.html",
  className = "",
}: {
  title?: string;
  src?: string;
  className?: string;
}) {
  return (
    <section
      className={`w-full max-w-5xl ${className}`}
      aria-label={title}
    >
      <p className="mb-3 text-sm text-zinc-400">
        Offline demo — runs entirely in your browser. No game server and no OpenAI
        usage from this embed.
      </p>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#06080f] shadow-2xl shadow-cyan-950/20">
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </div>
    </section>
  );
}
