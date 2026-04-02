/**
 * Embeds a Godot HTML5 export from /public/games/dml-godot (static files only; no API).
 */

function embedGameUrl(path = "games/dml-godot/index.html") {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return root ? `${root}/${path}` : `/${path}`;
}

export function DungeonMasterLiteGodotEmbed({
  title = "Dungeon Master Lite — browser demo",
  src,
  className = "",
}: {
  title?: string;
  /** Absolute path on same origin, e.g. from embedGameUrl(). Defaults to Godot export under public. */
  src?: string;
  className?: string;
}) {
  const iframeSrc = src ?? embedGameUrl();

  return (
    <section
      className={`w-full max-w-5xl ${className}`}
      aria-label={title}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Offline demo — runs entirely in the browser. No game server and no OpenAI usage
        from this embed.
      </p>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-primary/20 bg-card shadow-lg">
        <iframe
          src={iframeSrc}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        />
      </div>
    </section>
  );
}
