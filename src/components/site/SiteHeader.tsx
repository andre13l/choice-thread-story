import { Link } from "@tanstack/react-router";
import { Flame, Menu, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";
import { todayUTC } from "@/games/core/dailyStats";
import { completedToday, globalStreak } from "@/games/core/globalStreak";
import { useSession } from "@/games/core/useSession";

/**
 * Platform header: burger at the far left, wordmark, then the live daily
 * streak and a lightweight account affordance. Sparse by design — the page
 * below it is the product.
 */
export function SiteHeader({
  navOpen,
  onToggleNav,
  navPanelId,
}: {
  navOpen: boolean;
  onToggleNav: () => void;
  navPanelId: string;
}) {
  const [streak, setStreak] = useState(0);
  const [played, setPlayed] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const session = useSession();

  useEffect(() => {
    const today = todayUTC();
    setStreak(globalStreak(today));
    setPlayed(Object.values(completedToday(today)).filter(Boolean).length);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          onClick={onToggleNav}
          aria-expanded={navOpen}
          aria-controls={navPanelId}
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <Link
          to="/"
          className="min-w-0 truncate font-display text-[13px] font-bold tracking-[0.34em] text-foreground transition-opacity hover:opacity-70 sm:tracking-[0.4em]"
        >
          {SITE.name}
          <span className="hidden text-muted-foreground/70 sm:inline"> GAMES</span>
        </Link>

        <div ref={profileRef} className="relative flex shrink-0 items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-sm border border-border/70 px-2.5 py-1.5 text-[11px] font-medium tabular-nums text-foreground"
            title={`${streak} day streak`}
          >
            <Flame className="h-3.5 w-3.5 text-gold" aria-hidden />
            {streak}
            <span className="sr-only">day daily streak</span>
          </span>

          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-expanded={profileOpen}
            aria-label="Your progress"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <User className="h-4 w-4" />
          </button>

          {profileOpen && (
            <div className="anim-fade-up absolute right-0 top-full z-50 mt-2 w-64 rounded-sm border border-border bg-popover p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.5)]">
              <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
                Your progress
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Streak
                  </dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums text-foreground">
                    {streak}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Today
                  </dt>
                  <dd className="mt-1 font-display text-2xl tabular-nums text-foreground">
                    {played}/5
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                {session.userId
                  ? `Signed in as ${session.username ?? "your new profile"}.`
                  : "Progress is saved on this device. Add a profile to keep it anywhere."}
              </p>
              <Link
                to={session.userId ? "/profile" : "/auth"}
                onClick={() => setProfileOpen(false)}
                className="mt-4 block rounded-sm border border-foreground bg-foreground px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-background transition-colors hover:bg-transparent hover:text-foreground"
              >
                {session.userId ? "Your profile" : "Save your scores"}
              </Link>
              <Link
                to="/daily"
                onClick={() => setProfileOpen(false)}
                className="mt-2 block rounded-sm border border-border px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-accent"
              >
                Today&apos;s challenges
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
