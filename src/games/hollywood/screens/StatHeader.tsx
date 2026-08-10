import { fameTier, formatMoney } from "../scoring";
import type { GameState } from "../types";

/**
 * The career HUD. Shows only what the player is meant to know:
 * age, money, film count, Oscars, and public standing as a fame tier.
 * Every hidden engine stat stays hidden.
 */
export function StatHeader({ game }: { game: GameState }) {
  const s = game.stats;
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
        <span className="shrink-0">Age {s.age}</span>
        <span className="truncate text-foreground/90">{formatMoney(s.money)}</span>
        <span className="flex min-w-0 items-center gap-3 sm:gap-4">
          {s.movies > 0 && (
            <span className="hidden shrink-0 sm:inline">
              {s.movies} {s.movies === 1 ? "film" : "films"}
            </span>
          )}
          {s.oscars > 0 && (
            <span className="shrink-0 text-gold">
              {s.oscars} {s.oscars === 1 ? "Oscar" : "Oscars"}
            </span>
          )}
          <span className="truncate text-gold/90">{fameTier(s.fame)}</span>
        </span>
      </div>
    </header>
  );
}
