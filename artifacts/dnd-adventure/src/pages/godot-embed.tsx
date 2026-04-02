import { Link } from "wouter";
import { DungeonMasterLiteGodotEmbed } from "@/components/DungeonMasterLiteGodotEmbed";

/**
 * Minimal page for iframe embedding on another site, or open directly at /embed.
 */
export default function GodotEmbedPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-8 bg-background">
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent pointer-events-none" />
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-4 mb-6">
        <p className="font-serif text-lg text-primary text-glow">Dungeon Master Lite</p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          Open full app
        </Link>
      </header>
      <div className="relative z-10 w-full flex justify-center">
        <DungeonMasterLiteGodotEmbed className="max-w-full" />
      </div>
    </div>
  );
}
