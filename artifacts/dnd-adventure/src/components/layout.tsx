import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNarrativeQueryKey, getListCharactersQueryKey } from "@workspace/api-client-react";
import { useUser } from "@/hooks/use-user";
import { useGameEvents } from "@/hooks/use-game-events";
import { cn } from "@/lib/utils";
import { Scroll, Users, BookOpen, Shield, Settings, Search, FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LookupPopup } from "@/components/lookup-popup";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { username, setUsername } = useUser();
  const [tempUsername, setTempUsername] = useState(username);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { lastEvent } = useGameEvents();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "navigate" && lastEvent.to) {
      setLocation(`/${lastEvent.to}`);
    }

    if (lastEvent.type === "narrative-update" || lastEvent.type === "narrative-done") {
      queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCharactersQueryKey() });
    }
  }, [lastEvent, setLocation, queryClient]);

  const navItems = [
    {
      href: "/",
      label: "Testing",
      icon: FlaskConical,
      isActive: (loc: string) => loc === "/" || loc === "/testing",
    },
    { href: "/adventure", label: "Adventure", icon: Scroll },
    { href: "/characters", label: "Characters", icon: Users },
    { href: "/classes", label: "Classes", icon: Shield },
    { href: "/races", label: "Races", icon: BookOpen },
    { href: "/compendium", label: "Compendium", icon: Search },
  ];

  const handleSaveSettings = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/dungeon-bg.png)` }}
      />
      <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-background/80 via-background/95 to-background" />

      {/* Header */}
      <header className="w-full border-b border-primary/20 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-primary text-glow">D&D Auto-DM</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                "isActive" in item && typeof item.isActive === "function"
                  ? item.isActive(location)
                  : location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md font-serif text-lg transition-all duration-300",
                    isActive 
                      ? "text-primary bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(212,175,55,0.15)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-serif px-3 py-1.5 rounded bg-black/20 border border-white/5 hover:border-primary/30">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Playing as: <span className="text-foreground">{username}</span></span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border-primary/20 glass-panel">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl text-primary text-center">Adventure Settings</DialogTitle>
                </DialogHeader>
                <div className="py-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Set Your Username</label>
                    <input 
                      type="text" 
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-sans text-lg"
                      placeholder="Enter your name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveSettings()}
                    />
                    <p className="text-sm text-muted-foreground mt-1">This name will be used when you perform actions or create characters.</p>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-primary/80 to-primary text-primary-foreground font-serif font-bold text-xl rounded-lg shadow-lg hover:shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Save & Continue
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <LookupPopup />
    </div>
  );
}
