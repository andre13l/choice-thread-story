import { useNavigate } from "@tanstack/react-router";
import { Film, X } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "../../scoring";
import { directorTier } from "../offers";
import type { DirectorCareer } from "../types";

/**
 * Career HUD. Numbers, not sentences: year, money, output, awards and
 * how the town currently reads you.
 */
export function DirectorHeader({
  career,
  onOpenFilmography,
}: {
  career: DirectorCareer;
  onOpenFilmography: () => void;
}) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const tier = directorTier(career);
  const hasProgress = career.films.length > 0 || career.cycle > 1;

  const leave = () => navigate({ to: "/" });
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:px-6 sm:text-[11px]">
        <span className="shrink-0">
          <span className="text-foreground/90">Film #{career.films.length + 1}</span>{" "}
          <span className="text-muted-foreground/50">
            · {career.year} · {career.age}
          </span>
        </span>

        <span className={career.money < 0 ? "text-danger" : "text-foreground/90"}>
          {formatMoney(career.money)}
        </span>
        <span className="flex min-w-0 items-center gap-3 sm:gap-4">
          {career.oscars > 0 && (
            <span className="shrink-0 text-gold">
              {career.oscars} {career.oscars === 1 ? "Oscar" : "Oscars"}
            </span>
          )}
          <span className="hidden truncate text-gold/80 sm:inline">{tier}</span>
          <button
            onClick={onOpenFilmography}
            disabled={career.films.length === 0}
            className="flex shrink-0 items-center gap-1.5 border border-border/70 px-2.5 py-1 text-[10px] tracking-[0.18em] transition-colors hover:border-foreground/60 hover:text-foreground disabled:opacity-30"
          >
            <Film className="h-3 w-3" />
            {career.films.length}
          </button>
          <button
            onClick={() => (hasProgress ? setConfirming(true) : leave())}
            aria-label="Leave this career"
            title="Leave this career"
            className="flex shrink-0 items-center gap-1.5 border border-border/50 px-2 py-1 text-[10px] tracking-[0.18em] text-muted-foreground/60 transition-colors hover:border-foreground/50 hover:text-foreground"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </span>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm border border-border/70 bg-card/90 px-6 py-7 text-center">
            <p className="font-display text-lg tracking-[0.02em] text-foreground">Leave this career?</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              You can pick it up again later
            </p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="border border-border/70 px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={leave}
                className="border border-foreground bg-foreground px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] text-primary-foreground transition-colors hover:bg-transparent hover:text-foreground"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
